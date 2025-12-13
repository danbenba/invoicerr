import { Body, Controller, Post, Patch, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { User } from '@/decorators/user.decorator';
import { CurrentUser } from '@/types/user';
import { UserService } from './user.service';

@Controller('user')
export class UserController {
    constructor(private readonly userService: UserService) {}

    @Post('avatar')
    @UseInterceptors(FileInterceptor('image'))
    async uploadAvatar(
        @User() user: CurrentUser,
        @UploadedFile() file: any
    ) {
        if (!file) {
            throw new BadRequestException('No image file provided');
        }

        // Validate file type
        if (!file.mimetype.startsWith('image/')) {
            throw new BadRequestException('File must be an image');
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            throw new BadRequestException('File size must be less than 5MB');
        }

        return this.userService.updateAvatar(user.id, file);
    }

    @Patch('profile')
    async updateProfile(
        @User() user: CurrentUser,
        @Body() body: { salutation?: string; firstname?: string; lastname?: string; email?: string }
    ) {
        return this.userService.updateProfile(user.id, body);
    }
}
