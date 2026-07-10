import { UserPosition } from '@shared/enum/user-position.enum';

export const MINIMUM_CALL_DURATION_HOURS = 2.5;
export const CALL_DURATION_REACH_BONUS_SUM = 30_000;
export const ATTENDANCE_BONUS_SUM = 29_000;
export const PLAN_REACHED_BONUS_SUM = 500_000;
export const MINIMUM_MONTHLY_PLAN = 25_000_000;

export const FIXED_SALARY_BY_POSITION: Record<UserPosition, number> = {
  [UserPosition.JUNIOR]: 1_000_000,
  [UserPosition.MIDDLE]: 1_500_000,
  [UserPosition.SENIOR]: 2_000_000,
  [UserPosition.TEAM_LEAD]: 2_500_000,
};
