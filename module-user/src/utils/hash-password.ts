import * as bcrypt from 'bcryptjs';

export async function hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt();
    return bcrypt.hash(password, salt);
}

export async function checkPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return hashedPassword ? await bcrypt.compare(plainPassword, hashedPassword) : false;
}
