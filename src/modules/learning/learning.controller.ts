import { Body, Controller, Get, Param, Post, Query, Req } from '@nestjs/common';
import { DefaultAuthGuard } from '@common/guards/default-auth.guard';
import { EnrollmentService } from '@modules/learning/enrollment.service';
import { LearningService } from '@modules/integration/learning.service';
import { SearchStudentsRequest } from '@modules/learning/dto/search-students-request.dto';
import { CreateEnrollmentRequest } from '@modules/learning/dto/create-enrollment-request.dto';
import { CreatePendingEnrollmentRequest } from '@modules/learning/dto/create-pending-enrollment-request.dto';

@DefaultAuthGuard
@Controller('learning')
export class LearningController {
  constructor(
    private readonly learningService: LearningService,
    private readonly enrollmentService: EnrollmentService,
  ) {}

  @Get('students')
  searchStudents(@Query() query: SearchStudentsRequest) {
    return this.learningService.searchStudents(query);
  }

  @Get('courses')
  getCourses() {
    return this.learningService.listCourses();
  }

  @Post('enroll')
  enroll(@Req() req: any, @Body() body: CreateEnrollmentRequest) {
    return this.enrollmentService.enroll(req.user.id, body);
  }

  @Post('pending-enroll')
  requestEnroll(@Body() body: CreatePendingEnrollmentRequest) {
    return this.enrollmentService.requestEnrollment(body);
  }

  @Get('pending-enroll/:id')
  getPendingEnroll(@Param('id') id: string) {
    return this.enrollmentService.getPendingEnrollment(id);
  }
}
