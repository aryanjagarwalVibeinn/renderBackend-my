import User from "../Models/User.model";

export const generateUniqueUsername = async (): Promise<string> => {
  let username: string;
  let attempts = 0;

  do {
    const randomId = Math.floor(10000 + Math.random() * 90000);
    username = `user_${randomId}`;

    const existing = await User.findOne({ where: { username } });
    if (!existing) break;

    attempts++;
  } while (attempts < 5);

  return username;
};
