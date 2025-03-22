import React, { useState } from 'react';
import { Form, Button, Container, Row, Col } from 'react-bootstrap';

function FormPage_demo() {
  const [formData, setFormData] = useState({
    term: '',
    subject: '',
    courseNumber: '',
    selectedCourseTitle: '',
    grade: '',
    status: ''
  });

  const [selectedFile, setSelectedFile] = useState(null);

  // Mock data for dropdowns
  const terms = ['Fall 2023', 'Spring 2024', 'Summer 2024'];
  const subjects = ['INFOTC', 'CMP_SC', 'MATH', 'ENGLSH'];
  const courseNumbers = ['1000', '2000', '3000', '4000'];
  const courseTitles = ['Introduction to Programming', 'Data Structures', 'Database Systems', 'Web Development'];
  const grades = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'D-', 'F', 'N/A'];
  const statuses = ['Taken', 'Taking', 'Transferred'];

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
  };

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const handleFileSubmit = (e) => {
    e.preventDefault();
    if (selectedFile) {
      console.log('File submitted:', selectedFile);
      // Handle file upload logic here
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  return (
    <Container className="mt-5">
      <h1 className="text-center mb-4" style={{ color: 'black' }}>Submit Your Course History</h1>
      
      {/* PDF Upload Section */}
      <div className="mb-5">
        <h2 className="mb-4">Upload Degree Audit</h2>
        <Form onSubmit={handleFileSubmit}>
          <Form.Group className="mb-3">
            <Form.Control 
              type="file" 
              accept=".pdf"
              onChange={handleFileChange}
            />
          </Form.Group>
          <Button variant="primary" type="submit" disabled={!selectedFile}>
            Upload PDF
          </Button>
        </Form>
      </div>

      <hr className="my-5" />

      {/* Manual Entry Section */}
      <h2 className="mb-4">Or Enter Course History Manually</h2>
      <Form onSubmit={handleSubmit}>
        <h4 className="mb-3">Select from the Course List</h4>

        {/* Dropdown Selections */}
        <Row>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Term</Form.Label>
              <Form.Select name="term" value={formData.term} onChange={handleChange}>
                <option value="">Select Term</option>
                {terms.map(term => (
                  <option key={term} value={term}>{term}</option>
                ))}
              </Form.Select>
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Course Subject</Form.Label>
              <Form.Select name="subject" value={formData.subject} onChange={handleChange}>
                <option value="">Select Subject</option>
                {subjects.map(subject => (
                  <option key={subject} value={subject}>{subject}</option>
                ))}
              </Form.Select>
            </Form.Group>
          </Col>
        </Row>

        <Row>
          <Col md={4}>
            <Form.Group className="mb-3">
              <Form.Label>Course Number</Form.Label>
              <Form.Select name="courseNumber" value={formData.courseNumber} onChange={handleChange}>
                <option value="">Select Number</option>
                {courseNumbers.map(number => (
                  <option key={number} value={number}>{number}</option>
                ))}
              </Form.Select>
            </Form.Group>
          </Col>
          <Col md={8}>
            <Form.Group className="mb-3">
              <Form.Label>Course Title</Form.Label>
              <Form.Select 
                name="selectedCourseTitle" 
                value={formData.selectedCourseTitle} 
                onChange={handleChange}
              >
                <option value="">Select Course Title</option>
                {courseTitles.map(title => (
                  <option key={title} value={title}>{title}</option>
                ))}
              </Form.Select>
            </Form.Group>
          </Col>
        </Row>

        <Row>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Grade</Form.Label>
              <Form.Select 
                name="grade" 
                value={formData.grade} 
                onChange={handleChange}
              >
                <option value="">Select Grade</option>
                {grades.map(grade => (
                  <option key={grade} value={grade}>{grade}</option>
                ))}
              </Form.Select>
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Course Status</Form.Label>
              <Form.Select 
                name="status" 
                value={formData.status} 
                onChange={handleChange}
              >
                <option value="">Select Status</option>
                {statuses.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </Form.Select>
            </Form.Group>
          </Col>
        </Row>

        <Row className="mt-4">
          <Col className="d-flex justify-content-center gap-3">
            <Button variant="primary" type="submit" size="lg">
              Submit
            </Button>
            <Button variant="secondary" type="reset" size="lg">
              Reset
            </Button>
          </Col>
        </Row>
      </Form>
    </Container>
  );
}

export default FormPage_demo; 