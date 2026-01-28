/**
 * Ranking System: Bronze to Platinum
 * Points are earned from:
 * - Course Materials: 5 points each (when accessed)
 * - Video Lectures: 5 points each (when completed)
 * - Assignments (Quizzes): 5 points each (when completed)
 * - Exams: 5 points each (when completed)
 */

export type Rank = "Bronze" | "Silver" | "Gold" | "Platinum"

export interface RankingInfo {
  rank: Rank
  points: number
  nextRankPoints: number | null
  progress: number // 0-100
  color: string
  bgColor: string
  icon: string
}

const RANK_THRESHOLDS = {
  Bronze: 0,
  Silver: 50,
  Gold: 150,
  Platinum: 300,
}

export function calculateRank(points: number): RankingInfo {
  let rank: Rank = "Bronze"
  let nextRankPoints: number | null = RANK_THRESHOLDS.Silver

  if (points >= RANK_THRESHOLDS.Platinum) {
    rank = "Platinum"
    nextRankPoints = null
  } else if (points >= RANK_THRESHOLDS.Gold) {
    rank = "Gold"
    nextRankPoints = RANK_THRESHOLDS.Platinum
  } else if (points >= RANK_THRESHOLDS.Silver) {
    rank = "Silver"
    nextRankPoints = RANK_THRESHOLDS.Gold
  } else {
    rank = "Bronze"
    nextRankPoints = RANK_THRESHOLDS.Silver
  }

  // Calculate progress to next rank
  const currentThreshold = RANK_THRESHOLDS[rank]
  const progress = nextRankPoints
    ? Math.min(100, Math.max(0, ((points - currentThreshold) / (nextRankPoints - currentThreshold)) * 100))
    : 100

  const rankStyles = {
    Bronze: {
      color: "text-amber-700",
      bgColor: "bg-amber-100",
      icon: "🥉",
    },
    Silver: {
      color: "text-gray-600",
      bgColor: "bg-gray-100",
      icon: "🥈",
    },
    Gold: {
      color: "text-yellow-600",
      bgColor: "bg-yellow-100",
      icon: "🥇",
    },
    Platinum: {
      color: "text-purple-700",
      bgColor: "bg-purple-100",
      icon: "💎",
    },
  }

  return {
    rank,
    points,
    nextRankPoints,
    progress: Math.round(progress),
    ...rankStyles[rank],
  }
}

/**
 * Calculate total points for a student
 * - Course Materials: 5 points each (when accessed)
 * - Video Lectures: 5 points each (when completed)
 * - Assignments (Quizzes): 5 points each (when completed)
 * - Exams: 5 points each (when completed)
 */
export function calculateTotalPoints(data: {
  completedLessons: number
  completedMaterials: number
  completedAssignments: number
  completedExams: number
}): number {
  return (
    data.completedLessons * 5 + // Video lectures: 5 points each
    data.completedMaterials * 5 + // Course materials: 5 points each
    data.completedAssignments * 5 + // Assignments: 5 points each
    data.completedExams * 5 // Exams: 5 points each
  )
}
