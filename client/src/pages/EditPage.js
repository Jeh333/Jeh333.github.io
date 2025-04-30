import React, { useEffect, useState } from 'react';

const API_URL = "http://localhost:5000";

const EditPage = () => {
  const [courses, setCourses] = useState([]);
  const [editingIndex, setEditingIndex] = useState(null);

  const terms = [
    "Fall 2020",
    "Spring 2021",
    "Summer 2021",
    "Fall 2021",
    "Spring 2022",
    "Summer 2022",
    "Fall 2022",
    "Spring 2023",
    "Summer 2023",
    "Fall 2023",
    "Spring 2024",
    "Summer 2024",
    "Fall 2024",
    "Spring 2025",
    "Summer 2025",
  ];
  const grades = [
    "A+",
    "A",
    "A-",
    "B+",
    "B",
    "B-",
    "C+",
    "C",
    "C-",
    "D+",
    "D",
    "D-",
    "F",
    "W",
    "N/A",
  ];
  const statuses = ["Taken", "Taking", "Transferred"];

  useEffect(() => {
    const userId = localStorage.getItem('userId');
    if (!userId) return;

    fetch(`${API_URL}/api/user/courses?userId=${userId}`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => setCourses(data.courses || []))
      .catch(err => console.error('Error loading courses:', err));
  }, []);

  const handleChange = (index, field, value) => {
    const updated = [...courses];
    updated[index][field] = value;
    setCourses(updated);
  };

  const handleSave = (index) => {
    const userId = localStorage.getItem('userId');
    const course = courses[index];
    fetch(`${API_URL}/api/user/courses/${course._id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ userId, updatedCourse: course }),
    })
      .then(res => res.json())
      .then(() => setEditingIndex(null))
      .catch(err => console.error(err));
  };

  const handleDelete = (id) => {
    const userId = localStorage.getItem('userId');
    fetch(`${API_URL}/api/user/courses/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ userId }),
    })
      .then(res => {
        if (!res.ok) throw new Error('Delete failed');
        setCourses(prev => prev.filter(c => c._id !== id));
      })
      .catch(err => console.error('Delete error:', err));
  };

  return (
    <div style={{ padding: '1rem' }}>
      <h2>Edit Your Courses</h2>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
        {courses.map((course, index) => (
          <div
            key={course._id}
            style={{
              borderRadius: '12px',
              boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
              padding: '1rem',
              width: '250px',
              backgroundColor: '#fff',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem'
            }}
          >
            {editingIndex === index ? (
              <>
                <input value={course.programId} onChange={(e) => handleChange(index, 'programId', e.target.value)} />
                <select value={course.semester} onChange={(e) => handleChange(index, 'semester', e.target.value)}>
                  {terms.map(term => <option key={term} value={term}>{term}</option>)}
                </select>
                <select value={course.grade || ''} onChange={(e) => handleChange(index, 'grade', e.target.value)}>
                  {grades.map(grade => <option key={grade} value={grade}>{grade}</option>)}
                </select>
                <select value={course.status || ''} onChange={(e) => handleChange(index, 'status', e.target.value)}>
                  {statuses.map(status => <option key={status} value={status}>{status}</option>)}
                </select>
              </>
            ) : (
              <>
                <div><strong>Program ID:</strong> {course.programId}</div>
                <div><strong>Semester:</strong> {course.semester}</div>
                <div><strong>Grade:</strong> {course.grade || '-'}</div>
                <div><strong>Status:</strong> {course.status || '-'}</div>
              </>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem' }}>
              {editingIndex === index ? (
                <button onClick={() => handleSave(index)} style={{ backgroundColor: '#007bff', color: '#fff', border: 'none', padding: '0.5rem', borderRadius: '5px' }}>Save</button>
              ) : (
                <button onClick={() => setEditingIndex(index)} style={{ backgroundColor: '#007bff', color: '#fff', border: 'none', padding: '0.5rem', borderRadius: '5px' }}>Edit</button>
              )}
              <button onClick={() => handleDelete(course._id)} style={{ backgroundColor: '#dc3545', color: '#fff', border: 'none', padding: '0.5rem', borderRadius: '5px' }}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EditPage;
