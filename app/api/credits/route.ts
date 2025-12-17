import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();

    // 1. 获取当前用户
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. 查询 customer 记录
    const { data: customer, error } = await supabase
      .from('customers')
      .select(`*, credits_history (*)`) // 简化查询
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching customer:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    // 3. 【关键】兜底创建逻辑 (如果触发器没执行，这里补救)
    if (!customer) {
      console.log('检测到新用户无记录，正在执行 API 补救创建...');

      const { data: newCustomer, error: createError } = await supabase
        .from('customers')
        .insert({
          user_id: user.id,
          email: user.email || 'unknown@example.com',
          credits: 30, // ✅ 修正：必须是 30
          creem_customer_id: `api_fix_${user.id}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          metadata: {
            source: 'api_fallback',
            initial_credits: 30 // ✅ 修正
          }
        })
        .select()
        .single();

      if (createError) {
        console.error('API 补救创建失败 (可能是 RLS 权限问题):', createError);
        // 返回 0 分，避免前端报错崩溃
        return NextResponse.json({
          credits: { total_credits: 0, remaining_credits: 0, id: 'temp' }
        });
      }

      // 补写历史记录
      await supabase.from('credits_history').insert({
        customer_id: newCustomer.id,
        amount: 30, // ✅ 修正
        type: 'add',
        description: '新用户注册福利 (API补全)',
        metadata: { source: 'api_fallback' }
      });

      return NextResponse.json({
        credits: {
          id: newCustomer.id,
          user_id: newCustomer.user_id,
          total_credits: newCustomer.credits,
          remaining_credits: newCustomer.credits,
          created_at: newCustomer.created_at,
          updated_at: newCustomer.updated_at
        }
      });
    }

    // 4. 正常返回
    return NextResponse.json({
      credits: {
        id: customer.id,
        user_id: customer.user_id,
        total_credits: customer.credits,
        remaining_credits: customer.credits, // 你的前端用 remaining_credits
        created_at: customer.created_at,
        updated_at: customer.updated_at
      }
    });

  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST - 消费积分（使用统一的customers表）
export async function POST(request: NextRequest) {
  try {
    const { amount, operation } = await request.json();

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid credit amount' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // 获取当前用户
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 获取当前customer记录
    const { data: customer, error: fetchError } = await supabase
      .from('customers')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (fetchError) {
      console.error('Error fetching customer:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch customer data' },
        { status: 500 }
      );
    }

    // 检查积分是否足够
    if (customer.credits < amount) {
      return NextResponse.json(
        { error: 'Insufficient credits' },
        { status: 400 }
      );
    }

    // 更新积分
    const newCredits = customer.credits - amount;
    const { data: updatedCustomer, error: updateError } = await supabase
      .from('customers')
      .update({
        credits: newCredits,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating credits:', updateError);
      return NextResponse.json(
        { error: 'Failed to update credits' },
        { status: 500 }
      );
    }

    // 记录积分消费历史
    const { error: historyError } = await supabase
      .from('credits_history')
      .insert({
        customer_id: customer.id,
        amount: amount,
        type: 'subtract',
        description: operation || 'name_generation',
        metadata: {
          operation: operation,
          credits_before: customer.credits,
          credits_after: newCredits
        }
      });

    if (historyError) {
      console.error('Error recording credit transaction:', historyError);
      // 不影响主要流程，只记录错误
    }

    // 返回兼容的格式
    return NextResponse.json({
      credits: {
        id: updatedCustomer.id,
        user_id: updatedCustomer.user_id,
        total_credits: updatedCustomer.credits,
        remaining_credits: updatedCustomer.credits,
        created_at: updatedCustomer.created_at,
        updated_at: updatedCustomer.updated_at
      },
      success: true
    });
  } catch (error) {
    console.error('Credits spend API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}