#!/usr/bin/env python3
"""
YouTube Storyboard Thumbnail Extractor
安全提取 YouTube 视频的预览缩略图，无需下载完整视频

使用 YouTube 提供的 storyboard (sprite sheet) 功能来获取视频预览缩略图。
这种方法只下载小图片而非完整视频，大幅降低带宽和处理时间。
"""

import requests
import yt_dlp
from PIL import Image
from io import BytesIO
from pathlib import Path
from typing import Dict, Optional
import re

class StoryboardExtractor:
    """
    提取 YouTube Storyboard（预览拼图）并裁剪特定时间点的缩略图
    """
    
    def __init__(self, video_url: str):
        self.video_url = video_url
        self.video_id = self._extract_video_id(video_url)
        self.storyboard_spec = None
        
    def _extract_video_id(self, url: str) -> str:
        """从 URL 提取视频 ID"""
        if 'v=' in url:
            return url.split('v=')[1].split('&')[0]
        elif 'youtu.be/' in url:
            return url.split('youtu.be/')[1].split('?')[0]
        else:
            # 尝试使用正则表达式
            match = re.search(r'(?:v=|/)([0-9A-Za-z_-]{11}).*', url)
            if match:
                return match.group(1)
            raise ValueError(f"无法解析视频 ID: {url}")
    
    def get_storyboard_info(self) -> Dict:
        """
        获取 storyboard 信息
        
        Returns:
            {
                'url_template': str,  # URL 模板
                'tile_width': int,
                'tile_height': int,
                'tiles_per_row': int,
                'tiles_per_col': int,
                'interval_ms': int,  # 每个缩略图间隔（毫秒）
            }
        """
        if self.storyboard_spec:
            return self.storyboard_spec
        
        print(f"📊 Fetching storyboard info for video: {self.video_id}")
        
        ydl_opts = {
            'quiet': True,
            'no_warnings': True,
            'skip_download': True,
        }
        
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(self.video_url, download=False)
            
            # 尝试从 info 中提取 storyboard
            # YouTube 的 storyboard 信息通常在以下几个地方
            storyboard_data = None
            
            # 方法 1: 查找 formats 中的 storyboard
            if 'formats' in info:
                for fmt in info['formats']:
                    if fmt.get('format_note') == 'storyboard':
                        storyboard_data = fmt
                        break
            
            # 方法 2: 直接查找 storyboards 字段
            if not storyboard_data and 'storyboards' in info:
                storyboard_data = info['storyboards']
            
            # 方法 3: 构造默认的 storyboard URL（YouTube 的通用格式）
            if not storyboard_data:
                print("⚠️ No storyboard found in info, using fallback URL pattern")
                # 使用 YouTube 的标准 storyboard URL 格式
                # 格式：https://i.ytimg.com/sb/VIDEO_ID/storyboard3_L2/M$M.jpg
                self.storyboard_spec = {
                    'url_template': f'https://i.ytimg.com/sb/{self.video_id}/storyboard3_L2/M$M.jpg',
                    'tile_width': 160,
                    'tile_height': 90,
                    'tiles_per_row': 10,
                    'tiles_per_col': 10,
                    'interval_ms': 2000,  # 2 seconds per thumbnail
                }
                return self.storyboard_spec
            
            # 解析 storyboard 数据
            if isinstance(storyboard_data, dict):
                url = storyboard_data.get('url', '')
                if url:
                    self.storyboard_spec = {
                        'url_template': url,
                        'tile_width': storyboard_data.get('width', 160),
                        'tile_height': storyboard_data.get('height', 90),
                        'tiles_per_row': storyboard_data.get('columns', 10),
                        'tiles_per_col': storyboard_data.get('rows', 10),
                        'interval_ms': storyboard_data.get('interval', 2000),
                    }
                else:
                    raise Exception("Storyboard data found but no URL")
            else:
                raise Exception("Invalid storyboard data format")
            
            print(f"✅ Storyboard: {self.storyboard_spec['tile_width']}x{self.storyboard_spec['tile_height']}, "
                  f"{self.storyboard_spec['tiles_per_row']}x{self.storyboard_spec['tiles_per_col']} grid, "
                  f"interval={self.storyboard_spec['interval_ms']}ms")
            
            return self.storyboard_spec
    
    def get_thumbnail_at_timestamp(self, timestamp_seconds: float, output_path: Path) -> str:
        """
        获取指定时间戳的缩略图并保存
        
        Args:
            timestamp_seconds: 时间戳（秒）
            output_path: 输出文件路径
        
        Returns:
            保存的文件路径
        """
        if output_path.exists():
            print(f"✅ Thumbnail already exists: {output_path.name}")
            return str(output_path)
        
        spec = self.get_storyboard_info()
        
        # 计算时间戳对应的 tile 索引
        timestamp_ms = timestamp_seconds * 1000
        tile_index = int(timestamp_ms / spec['interval_ms'])
        
        # 计算在拼图中的位置
        tiles_per_sheet = spec['tiles_per_row'] * spec['tiles_per_col']
        sheet_index = tile_index // tiles_per_sheet
        tile_in_sheet = tile_index % tiles_per_sheet
        
        row = tile_in_sheet // spec['tiles_per_row']
        col = tile_in_sheet % spec['tiles_per_row']
        
        # 构建 storyboard URL
        storyboard_url = spec['url_template']
        # 替换模板中的占位符 $M, $N 等
        storyboard_url = storyboard_url.replace('$M', str(sheet_index))
        storyboard_url = storyboard_url.replace('$N', str(sheet_index))
        
        print(f"📥 Downloading storyboard sheet {sheet_index} for t={timestamp_seconds:.1f}s (tile {tile_index})...")
        print(f"   Position in sheet: row={row}, col={col}")
        
        try:
            # 下载 storyboard 图片
            response = requests.get(storyboard_url, timeout=30)
            response.raise_for_status()
            
            #加载图片
            storyboard_img = Image.open(BytesIO(response.content))
            img_width, img_height = storyboard_img.size
            print(f"   Downloaded storyboard: {img_width}x{img_height} pixels")
            
            # 计算裁剪坐标
            x1 = col * spec['tile_width']
            y1 = row * spec['tile_height']
            x2 = x1 + spec['tile_width']
            y2 = y1 + spec['tile_height']
            
            # 确保坐标不超出图片范围
            x2 = min(x2, img_width)
            y2 = min(y2, img_height)
            
            print(f"   Cropping: ({x1}, {y1}) to ({x2}, {y2})")
            
            # 裁剪缩略图
            thumbnail = storyboard_img.crop((x1, y1, x2, y2))
            
            # 保存
            output_path.parent.mkdir(parents=True, exist_ok=True)
            thumbnail.save(str(output_path), 'JPEG', quality=85)
            
            print(f"✅ Saved thumbnail: {output_path.name} ({thumbnail.size[0]}x{thumbnail.size[1]})")
            
            return str(output_path)
            
        except requests.RequestException as e:
            raise Exception(f"下载 storyboard 失败: {e}")
        except Exception as e:
            raise Exception(f"处理 storyboard 失败: {e}")


# 测试代码
if __name__ == '__main__':
    import sys
    
    if len(sys.argv) < 3:
        print("Usage: python storyboard_extractor.py <video_url> <timestamp_seconds>")
        sys.exit(1)
    
    video_url = sys.argv[1]
    timestamp = float(sys.argv[2])
    
    extractor = StoryboardExtractor(video_url)
    output_path = Path(f"test_thumbnail_{int(timestamp)}.jpg")
    
    result = extractor.get_thumbnail_at_timestamp(timestamp, output_path)
    print(f"\n✅ Test successful! Thumbnail saved to: {result}")
