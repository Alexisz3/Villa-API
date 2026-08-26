import { Controller, Post, Patch, ParseIntPipe, Param, Body, HttpCode, HttpStatus, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ContactMessagesService } from './contact-messages.service';
import { CreateContactMessageDto } from './dto/create-contact-message.dto';
import { UpdateContactMessageStatusDto } from './dto/update-contact-message-status.dto';
import { AuthGuard } from '../auth/auth.guard';
import { UseGuards } from '@nestjs/common';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { PermissionsGuard } from '../auth/guards/permissions.guard';

@ApiTags('Contact Messages')
@ApiBearerAuth()
@Controller('contact-messages')
export class ContactMessagesController {
    constructor(private readonly contactMessagesService: ContactMessagesService) { }

    @Post()
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Create a new contact message' })
    @ApiResponse({ status: 201, description: 'The contact message has been successfully created.' })
    @ApiResponse({ status: 400, description: 'Bad Request. Validation failed.' })
    create(@Body() dto: CreateContactMessageDto) {
        return this.contactMessagesService.create(dto);
    }

    @UseGuards(AuthGuard, PermissionsGuard)
    @RequirePermissions('contact_messages:read')
    @Get()
    @ApiOperation({ summary: 'Get all contact messages' })
    @ApiResponse({ status: 200, description: 'Return all contact messages.' })
    findAll() {
        return this.contactMessagesService.findAll();
    }

    @UseGuards(AuthGuard, PermissionsGuard)
    @RequirePermissions('contact_messages:read')
    @Get(':id')
    @ApiOperation({ summary: 'Get a contact message by id' })
    @ApiResponse({ status: 200, description: 'Return the contact message.' })
    @ApiResponse({ status: 404, description: 'Contact message not found.' })
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.contactMessagesService.findOne(id);
    }

    @UseGuards(AuthGuard, PermissionsGuard)
    @RequirePermissions('contact_messages:update')
    @Patch(':id/status')
    @ApiOperation({ summary: 'Update the status of a contact message' })
    @ApiResponse({ status: 200, description: 'The contact message status has been successfully updated.' })
    @ApiResponse({ status: 404, description: 'Contact message not found.' })
    updateStatus(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateContactMessageStatusDto,
    ) {
        return this.contactMessagesService.updateStatus(id, dto.status);
    }
}

