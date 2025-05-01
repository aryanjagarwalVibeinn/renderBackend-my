// utils/blockCheck.util.ts
import User from "../Models/User.model";

export const isUserBlocked = async (viewerId: string, targetUserId: string): Promise<boolean> => {
  const viewer = await User.findOne({ where: { userId: viewerId } });
  const targetUser = await User.findOne({ where: { userId: targetUserId } });

  if (!viewer || !targetUser) return false;

  return (
    viewer.blockedUsers?.includes(targetUserId) ||
    targetUser.blockedUsers?.includes(viewerId)
  );
};
