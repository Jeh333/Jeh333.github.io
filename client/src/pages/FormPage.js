import React, { useState } from "react";
import { Form, Button, Container, Row, Col } from "react-bootstrap";
import majors from "../data/majors.json";


function FormPage() {
  const [formData, setFormData] = useState({
    term: "",
    subject: "",
    courseNumber: "",
    grade: "",
    status: "",
  });

  const [selectedFile, setSelectedFile] = useState(null);
  const [major, setMajor] = useState("");

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
  const subjects = [
    "ACCTY",
    "AERO",
    "ABM",
    "AAE",
    "AG_ED_LD",
    "AG_S_M",
    "AGSC_COM",
    "AG_S_TCH",
    "AFNR",
    "AMS",
    "ANESTH",
    "AN_SCI",
    "ANTHRO",
    "ARABIC",
    "ARCHST",
    "ART_VS",
    "ARTCE_VS",
    "ARTDR_VS",
    "ARTFI_VS",
    "ARTGD_VS",
    "ARTGE_VS",
    "ARTPA_VS",
    "ARTPH_VS",
    "ARTPR_VS",
    "ARTSC_VS",
    "ARH_VS",
    "ASTRON",
    "ATHTRN",
    "ATM_SC",
    "BIOCHM",
    "BIOL_EN",
    "BIO_SC",
    "BME",
    "BBME",
    "BIOMED",
    "BL_STU",
    "BUS_AD",
    "CH_ENG",
    "CHEM",
    "CH_HTH",
    "CHINESE",
    "CV_ENG",
    "CDS",
    "CL_L_S",
    "COMMUN",
    "CMP_SC",
    "CNST_DEM",
    "DATA_SCI",
    "DERM",
    "DMU",
    "DST_VS",
    "ECONOM",
    "EDUC_H",
    "ED_LPA",
    "ELSP",
    "ESC_PS",
    "ECE",
    "EMR_ME",
    "ENGINR",
    "ENGLSH",
    "ENV_SC",
    "ENV_ST",
    "F_C_MD",
    "FILMS_VS",
    "FINANC",
    "F_W",
    "FINPLN",
    "FPM",
    "F_S",
    "FOREST",
    "FRENCH",
    "G_STUDY",
    "GENETICS",
    "GEOG",
    "GEOL",
    "GERMAN",
    "GN_HES",
    "GN_HON",
    "GRAD",
    "GREEK",
    "HLTH_ADM",
    "H_D_FS",
    "HR_SCI",
    "HLTH_HUM",
    "HMI",
    "HTH_PR",
    "HLTH_SCI",
    "HEBREW",
    "HIST",
    "HSP_MGMT",
    "IEPG",
    "IEPL",
    "IEPR",
    "IEPS",
    "IEPW",
    "IMSE",
    "ISE",
    "IS_LT",
    "INFOINST",
    "INFOTC",
    "INTDSC",
    "IN_MED",
    "INTL_S",
    "ITAL",
    "JAPNSE",
    "JOURN",
    "KOREAN",
    "LAB_AN",
    "LATIN",
    "LAW",
    "LG_LT_CT",
    "LTC",
    "LTC_V",
    "LINST",
    "MAE",
    "MANGMT",
    "MATH",
    "MDVL_REN",
    "MED_ID",
    "MICROB",
    "MIL_SC",
    "MPP",
    "MRKTNG",
    "MUS_APMS",
    "MUS_EDUC",
    "MUS_ENS",
    "MUS_GENL",
    "MUS_H_LI",
    "MUS_I_VR",
    "MUS_I_VT",
    "MUS_THRY",
    "MUSIC_NM",
    "NAIS",
    "NAT_R",
    "NAVY",
    "NEP",
    "NEUROL",
    "NEUROSCI",
    "NU_ENG",
    "NUCMED",
    "NURSE",
    "NUTRIT",
    "OB_GYN",
    "OC_THR",
    "OPHTH",
    "P_HLTH",
    "PAW_EDUC",
    "PEA_ST",
    "PH_THR",
    "PHIL",
    "PHYSCS",
    "PLNT_SCI",
    "PM_REH",
    "POL_SC",
    "PORT",
    "PRST",
    "PSCHTY",
    "PSYCH",
    "PTH_AS",
    "PUB_AF",
    "RA_SCI",
    "RADIOL",
    "REL_ST",
    "RM_LAN",
    "RS_THR",
    "RU_SOC",
    "RUSS",
    "S_A_ST",
    "SLHS",
    "SOC_WK",
    "SOCIOL",
    "SOIL",
    "SPAN",
    "SPC_ED",
    "SRV_LRN",
    "SSC",
    "STAT",
    "SURGRY",
    "T_A_M",
    "THEATR",
    "TR_BIOSC",
    "V_BSCI",
    "V_M_S",
    "V_PBIO",
    "VET_TCH",
    "WGST",
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    const course = {
      programId: `${formData.subject} ${formData.courseNumber}`,
      semester: formData.term,
      grade: formData.grade,
    };

    const userId = localStorage.getItem("userId");

    try {
      const response = await fetch(
        "http://localhost:5000/submit-course-history",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, courses: [course] }),
        }
      );

      if (response.ok) {
        alert("Course successfully submitted!");
      } else {
        const err = await response.json();
        console.error("Failed response:", err);
        alert("Failed to submit course.");
      }
    } catch (error) {
      console.error("Submit error:", error);
      alert("An error occurred while submitting the course.");
    }
  };

  const handleFileChange = (e) => setSelectedFile(e.target.files[0]);

  const handleFileSubmit = async (e) => {
    e.preventDefault();

    if (!selectedFile) {
      alert("Please select a file.");
      return;
    }

    const formData = new FormData();
    formData.append("pdf", selectedFile);
    formData.append("userId", localStorage.getItem("userId"));

    try {
      const response = await fetch("http://localhost:5000/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (response.ok) {
        alert("Upload successful!");
        console.log(data);
      } else {
        alert("Upload failed: " + data.error);
      }
    } catch (err) {
      console.error("Network error:", err);
      alert("Could not connect to server.");
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleSetMajor = async () => {
    const userId = localStorage.getItem("userId");

    try {
      const res = await fetch("http://localhost:5000/set-major", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId, major }),
      });

      const data = await res.json();
      if (res.ok) {
        alert("Major set successfully!");
      } else {
        console.error("Failed to set major:", data);
        alert("Failed to set major.");
      }
    } catch (err) {
      console.error("Error setting major:", err);
      alert("An error occurred while setting the major.");
    }
  };

  return (
    <Container className="mt-5">
      <h1 className="text-center mb-4" style={{ color: "black" }}>
        Submit Your Course History
      </h1>

      {/* Major Selection Section */}
      <hr className="my-5" />
      <h2 className="mb-3">Set Your Major</h2>
      <Form.Group className="mb-3">
        <Form.Label>Select Major</Form.Label>
        <Form.Select value={major} onChange={(e) => setMajor(e.target.value)}>
          <option value="">Select Your Major</option>
          {majors.map((m) =>
            m.types.map((type) => (
              <option key={`${m.name}-${type}`} value={m.name}>
                {m.name} ({type})
              </option>
            ))
          )}
        </Form.Select>
      </Form.Group>
      <Button variant="success" onClick={handleSetMajor}>
        Save Major
      </Button>
      <hr className="my-5" />
      {/* PDF Upload Section */}
      <div className="mb-5">
        <h2 className="mb-4">Upload Degree Audit</h2>
        <Form onSubmit={handleFileSubmit} encType="multipart/form-data">
          <Form.Group className="mb-3">
            <Form.Control
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
            />
          </Form.Group>
          <Button
            variant="primary"
            type="submit"
            disabled={!selectedFile || !major.trim()}
          >
            Upload PDF
          </Button>
        </Form>
      </div>

      <hr className="my-5" />

      {/* Manual Entry Section */}
      <h2 className="mb-4">Or Enter Course History Manually</h2>
      <Form onSubmit={handleSubmit}>
        <h4 className="mb-3">Select from the Course List</h4>

        <Row>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Term</Form.Label>
              <Form.Select
                name="term"
                value={formData.term}
                onChange={handleChange}
              >
                <option value="">Select Term</option>
                {terms.map((term) => (
                  <option key={term} value={term}>
                    {term}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Course Subject</Form.Label>
              <Form.Select
                name="subject"
                value={formData.subject}
                onChange={handleChange}
              >
                <option value="">Select Subject</option>
                {subjects.map((subject) => (
                  <option key={subject} value={subject}>
                    {subject}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          </Col>
        </Row>

        <Row>
          <Col md={4}>
            <Form.Group className="mb-3">
              <Form.Label>Course Number</Form.Label>
              <Form.Control
                type="text"
                name="courseNumber"
                value={formData.courseNumber}
                onChange={handleChange}
                placeholder="Enter course number"
              />
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
                {grades.map((grade) => (
                  <option key={grade} value={grade}>
                    {grade}
                  </option>
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
                {statuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          </Col>
        </Row>

        <Row className="mt-4">
          <Col className="d-flex justify-content-center gap-3">
            <Button
              variant="primary"
              type="submit"
              size="lg"
              disabled={!major.trim()}
            >
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

export default FormPage;