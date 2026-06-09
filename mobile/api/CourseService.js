import apiClient from './client';

export const CourseService = {
  getAllCourses: async () => {
    try {
      const response = await apiClient.get('/courses');
      return response.data;
    } catch (error) {
      console.error('Error fetching courses:', error);
      throw error;
    }
  },

  getCourseDetails: async (id) => {
    const response = await apiClient.get(`/courses/${id}`);
    return response.data;
  },

  getFeaturedCourses: async () => {
    const response = await apiClient.get('/courses/featured');
    return response.data;
  }
};
