import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// GET - 获取用户积分（使用统一的customers表）
export async function GET() {
  try {
    const supabase = await createClient();

    // 获取当前用户
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 查询用户的customer记录
    const { data: customer, error } = await supabase
      .from('customers')
      .select(`
        *,
        credits_history (
          amount,
          type,
          created_at,
          description
        )
      `)
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error fetching customer data:', error);
      return NextResponse.json(
        { error: 'Failed to fetch customer data' },
        { status: 500 }
      );
    }

    // 如果用户没有customer记录，创建一个默认记录
    if (!customer) {
      const { data: newCustomer, error: createError } = await supabase
        .from('customers')
        .insert({
          user_id: user.id,
          email: user.email || 'unknown@example.com',
          credits: 30, // 🟢 修改点 1：将 3 改为 30
          creem_customer_id: `new_user_${user.id}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          metadata: {
            source: 'chinese_name_generator',
            initial_credits: 30 // 🟢 修改点 2：将 3 改为 30
          }
        })
        .select(`
          *,
          credits_history (
            amount,
            type,
            created_at,
            description
          )
        `)
        .single();

      if (createError) {
        console.error('Error creating customer record:', createError);
        return NextResponse.json(
          { error: 'Failed to create customer record' },
          { status: 500 }
        );
      }

      // 记录初始积分赠送
      await supabase
        .from('credits_history')
        .insert({
          customer_id: newCustomer.id,
          amount: 30, // 🟢 修改点 3：将 3 改为 30
          type: 'add',
          description: 'Welcome bonus for new user',
          metadata: { source: 'welcome_bonus' }
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

    // 返回兼容的格式
    return NextResponse.json({
      credits: {
        id: customer.id,
        user_id: customer.user_id,
        total_credits: customer.credits, // 使用当前积分作为总积分
        remaining_credits: customer.credits,
        created_at: customer.created_at,
        updated_at: customer.updated_at
      }
    });
  } catch (error) {
    console.error('Credits API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
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