import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { PlanningService } from '../services/planning.service';
import {
  CreateCourseDto,
  UpdateCourseDto,
  CreateTourneeDto,
  UpdateTourneeDto,
  GenerateCoursesDto,
  PublishPlanningDto,
  ListCoursesQueryDto,
  ListTourneesQueryDto,
} from '../dto/planning.dto';

@Controller('conception/planning')
export class PlanningController {
  constructor(private readonly planningService: PlanningService) {}

  // ============================================
  // Courses
  // ============================================

  @Get('courses')
  async findAllCourses(@Query() query: ListCoursesQueryDto) {
    return this.planningService.findAllCourses(query);
  }

  @Get('courses/:id')
  async findOneCourse(@Param('id', ParseUUIDPipe) id: string) {
    return this.planningService.findOneCourse(id);
  }

  @Post('courses')
  async createCourse(@Body() dto: CreateCourseDto) {
    return this.planningService.createCourse(dto);
  }

  @Patch('courses/:id')
  async updateCourse(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCourseDto,
  ) {
    return this.planningService.updateCourse(id, dto);
  }

  @Delete('courses/:id')
  async deleteCourse(@Param('id', ParseUUIDPipe) id: string) {
    return this.planningService.deleteCourse(id);
  }

  // ============================================
  // Tournees
  // ============================================

  @Get('tournees')
  async findAllTournees(@Query() query: ListTourneesQueryDto) {
    return this.planningService.findAllTournees(query);
  }

  @Get('tournees/:id')
  async findOneTournee(@Param('id', ParseUUIDPipe) id: string) {
    return this.planningService.findOneTournee(id);
  }

  @Post('tournees')
  async createTournee(@Body() dto: CreateTourneeDto) {
    return this.planningService.createTournee(dto);
  }

  @Patch('tournees/:id')
  async updateTournee(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTourneeDto,
  ) {
    return this.planningService.updateTournee(id, dto);
  }

  @Delete('tournees/:id')
  async deleteTournee(@Param('id', ParseUUIDPipe) id: string) {
    return this.planningService.deleteTournee(id);
  }

  // ============================================
  // Generation & Publishing
  // ============================================

  @Post('generate')
  async generateCourses(@Body() dto: GenerateCoursesDto) {
    return this.planningService.generateCoursesForWeek(dto);
  }

  @Post('publish')
  async publishPlanning(@Body() dto: PublishPlanningDto) {
    return this.planningService.publishPlanning(dto);
  }

  // ============================================
  // Versions & Health
  // ============================================

  @Get('versions')
  async findAllVersions() {
    return this.planningService.findAllVersions();
  }

  @Get('health')
  async getHealthMetrics(@Query('weekStart') weekStart: string) {
    return this.planningService.getHealthMetrics(weekStart);
  }
}
