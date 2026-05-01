export type AppGroupType = 'couple' | 'friends';

export type GroupSnapshot = {
  id: string;
  name: string;
  groupType: AppGroupType;
  inviteCode: string;
  inviteUrl: string;
  memberCount: number;
  maxMembers: number;
  isOwner: boolean;
};

export function createInviteCode(prefix: AppGroupType) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = prefix === 'couple' ? 'CP-' : 'FR-';
  for (let index = 0; index < 6; index += 1) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export function groupTypeFromValue(value: unknown): AppGroupType {
  return value === 'friends' ? 'friends' : 'couple';
}
