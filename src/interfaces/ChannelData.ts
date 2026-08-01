// src/interfaces/ChannelData.ts (or similar file)

interface Aggregates {
  avgEngagementRate: number; // View-based E.R. from backend
  avgLikesPerVideo: number;
  avgCommentsPerVideo: number;
  likesPercent: number;
  commentsPercent: number;
}

interface ChannelInfo extends Aggregates {
  id: string;
  title: string;
  description: string;
  profile_picture: string;
  banner_image?: string;
  viewCount: number;
  subscriberCount: number;
  isSubsHidden: boolean; // Added in backend to handle hidden subs
  videoCount: number;
  publishedAt: string;
  channelAgeDays: number;
  channelAgePretty: string;
  avgViewsPerVideo: number;
  viewsPerDay: number;
  subsToViewsRatio: number;
  
  // 💡 NEW METRIC from the updated backend
  monthlySubsGrowth: number; 
}

interface VideoStats {
  id: string;
  title: string;
  views: number;
  likes: number;
  comments: number;
  publishedAt: string;
}

export interface ChannelPerformanceResponse {
  channel_info: ChannelInfo;
  video_stats: VideoStats[];
}