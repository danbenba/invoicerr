import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { writeFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { existsSync } from 'fs';

@Injectable()
export class UserService {
    constructor(private readonly prisma: PrismaService) {}

    async updateAvatar(userId: string, file: any): Promise<{ image: string }> {
        // Create avatars directory if it doesn't exist
        const avatarsDir = join(process.cwd(), 'public', 'avatars');
        if (!existsSync(avatarsDir)) {
            await mkdir(avatarsDir, { recursive: true });
        }

        // Generate unique filename
        const fileExtension = file.originalname.split('.').pop() || 'jpg';
        const filename = `${userId}-${Date.now()}.${fileExtension}`;
        const filepath = join(avatarsDir, filename);

        // Save file
        await writeFile(filepath, file.buffer);

        // Update user in database with relative path
        const imagePath = `/avatars/${filename}`;
        await this.prisma.user.update({
            where: { id: userId },
            data: { image: imagePath },
        });

        return { image: imagePath };
    }

    async updateProfile(
        userId: string,
        data: { salutation?: string; firstname?: string; lastname?: string; email?: string }
    ): Promise<any> {
        const updateData: any = {};

        if (data.salutation !== undefined) {
            // Validate salutation
            if (data.salutation && !['Mr', 'Ms', 'Mrs'].includes(data.salutation)) {
                throw new Error('Invalid salutation. Must be Mr, Ms, or Mrs');
            }
            updateData.salutation = data.salutation || null;
        }

        if (data.firstname !== undefined) {
            updateData.firstname = data.firstname;
        }

        if (data.lastname !== undefined) {
            updateData.lastname = data.lastname;
        }

        if (data.email !== undefined) {
            updateData.email = data.email;
        }

        const updatedUser = await this.prisma.user.update({
            where: { id: userId },
            data: updateData,
        });

        // Return only the fields we need
        return {
            id: updatedUser.id,
            firstname: updatedUser.firstname,
            lastname: updatedUser.lastname,
            email: updatedUser.email,
            image: updatedUser.image,
            salutation: (updatedUser as any).salutation,
        };
    }
}

