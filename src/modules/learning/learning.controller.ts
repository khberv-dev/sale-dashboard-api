import { Body, Controller, Get, Post, Query, Req } from '@nestjs/common';
import { DefaultAuthGuard } from '@common/guards/default-auth.guard';
import { EnrollmentService } from '@modules/learning/enrollment.service';
import { LearningService } from '@modules/integration/learning.service';
import { SearchStudentsRequest } from '@modules/learning/dto/search-students-request.dto';
import { CreateEnrollmentRequest } from '@modules/learning/dto/create-enrollment-request.dto';

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
}
