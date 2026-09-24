const payload = {
  course: {
    courseId: 'test-course',
    name: 'Test Course',
    code: 'TC101'
  },
  teachingPlan: {
    settings: {
      report: {
        institute: 'NEW INSTITUTE',
        department: 'NEW DEPT',
        hodName: 'NEW HOD',
        iqacCoordinator: 'NEW IQAC',
        remarks: 'NEW REMARKS'
      }
    }
  }
};

fetch('http://localhost:3001/api/v2/courses/test-course/details', {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload)
})
.then(res => res.json())
.then(data => console.log('PATCH RESPONSE:', data))
.catch(err => console.error(err));
