import React, { useEffect, useState } from "react";
import {
    Chart as ChartJS,
    BarElement,
    CategoryScale,
    LinearScale,
    Tooltip,
    Legend,
  } from "chart.js";
import { Bar } from "react-chartjs-2";
import { Form } from "react-bootstrap";
import majors from "../data/majors.json";
import { Button } from "react-bootstrap";

const COURSE_PREFIXES = [
    "ACCTY", "AERO", "ABM", "AAE", "AG_ED_LD", "AG_S_M", "AGSC_COM", "AG_S_TCH", "AFNR",
    "AMS", "ANESTH", "AN_SCI", "ANTHRO", "ARABIC", "ARCHST", "ART_VS", "ARTCE_VS", 
    "ARTDR_VS", "ARTFI_VS", "ARTGD_VS", "ARTGE_VS", "ARTPA_VS", "ARTPH_VS", "ARTPR_VS", 
    "ARTSC_VS", "ARH_VS", "ASTRON", "ATHTRN", "ATM_SC", "BIOCHM", "BIOL_EN", "BIO_SC", 
    "BME", "BBME", "BIOMED", "BL_STU", "BUS_AD", "CH_ENG", "CHEM", "CH_HTH", "CHINESE", 
    "CV_ENG", "CDS", "CL_L_S", "COMMUN", "CMP_SC", "CNST_DEM", "DATA_SCI", "DERM", "DMU", 
    "DST_VS", "ECONOM", "EDUC_H", "ED_LPA", "ELSP", "ESC_PS", "ECE", "EMR_ME", "ENGINR", 
    "ENGLSH", "ENV_SC", "ENV_ST", "F_C_MD", "FILMS_VS", "FINANC", "F_W", "FINPLN", "FPM", 
    "F_S", "FOREST", "FRENCH", "G_STUDY", "GENETICS", "GEOG", "GEOL", "GERMAN", "GN_HES", 
    "GN_HON", "GRAD", "GREEK", "HLTH_ADM", "H_D_FS", "HR_SCI", "HLTH_HUM", "HMI", "HTH_PR", 
    "HLTH_SCI", "HEBREW", "HIST", "HSP_MGMT", "IEPG", "IEPL", "IEPR", "IEPS", "IEPW", "IMSE", 
    "ISE", "IS_LT", "INFOINST", "INFOTC", "INTDSC", "IN_MED", "INTL_S", "ITAL", "JAPNSE", 
    "JOURN", "KOREAN", "LAB_AN", "LATIN", "LAW", "LG_LT_CT", "LTC", "LTC_V", "LINST", "MAE", 
    "MANGMT", "MATH", "MDVL_REN", "MED_ID", "MICROB", "MIL_SC", "MPP", "MRKTNG", "MUS_APMS", 
    "MUS_EDUC", "MUS_ENS", "MUS_GENL", "MUS_H_LI", "MUS_I_VR", "MUS_I_VT", "MUS_THRY", 
    "MUSIC_NM", "NAIS", "NAT_R", "NAVY", "NEP", "NEUROL", "NEUROSCI", "NU_ENG", "NUCMED", 
    "NURSE", "NUTRIT", "OB_GYN", "OC_THR", "OPHTH", "P_HLTH", "PAW_EDUC", "PEA_ST", "PH_THR", 
    "PHIL", "PHYSCS", "PLNT_SCI", "PM_REH", "POL_SC", "PORT", "PRST", "PSCHTY", "PSYCH", 
    "PTH_AS", "PUB_AF", "RA_SCI", "RADIOL", "REL_ST", "RM_LAN", "RS_THR", "RU_SOC", "RUSS", 
    "S_A_ST", "SLHS", "SOC_WK", "SOCIOL", "SOIL", "SPAN", "SPC_ED", "SRV_LRN", "SSC", "STAT", 
    "SURGRY", "T_A_M", "THEATR", "TR_BIOSC", "V_BSCI", "V_M_S", "V_PBIO", "VET_TCH", "WGST"
];
ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

function Statistics() {
  const [major, setMajor] = useState("");
  const [availableMajors, setAvailableMajors] = useState([]);
  const [semesterData, setSemesterData] = useState({});
  const [statType, setStatType] = useState("distribution");
  const [selectedPrefixes, setSelectedPrefixes] = useState([]);
  const [showPrefixFilter, setShowPrefixFilter] = useState(false);

  useEffect(() => {
    setAvailableMajors(majors.map((m) => m.name));
  }, []);

  const handleSubmit = async () => {
    if (!major) return;
    try {
      const res = await fetch(`http://localhost:5000/statistics/${major}?type=${statType}`);
      const text = await res.text();
      const data = JSON.parse(text);
      setSemesterData(data);
    } catch (err) {
      console.error("Error fetching statistics:", err);
    }
  };

  return (
    <div className="container mt-5 text-center">
      <h1>Statistics by Major</h1>

      <Form.Select
        className="my-4 w-50 mx-auto"
        value={major}
        onChange={(e) => setMajor(e.target.value)}
      >
        <option value="">Select a Major</option>
        {availableMajors.map((m) => (
          <option key={m} value={m}>
            {m}
          </option>
        ))}
      </Form.Select>
      <Form.Select
        className="my-4 w-50 mx-auto"
        value={statType}
        onChange={(e) => setStatType(e.target.value)}
        >
        <option value="distribution">Course Distribution by Semester</option>
        <option value="grades">Grade Distribution by Course</option>
        </Form.Select>
        <Form.Check
            type="checkbox"
            label="Filter by Course Prefix"
            className="mb-2 text-start w-50 mx-auto"
            checked={showPrefixFilter}
            onChange={(e) => setShowPrefixFilter(e.target.checked)}
        />
        {showPrefixFilter && (
            <Form.Group className="mb-3 text-start w-50 mx-auto">
                <Form.Label>Filter by Course Prefix</Form.Label>
                <div style={{ maxHeight: "200px", overflowY: "scroll", border: "1px solid #ccc", padding: "10px" }}>
                    {COURSE_PREFIXES.map((prefix) => (
                    <Form.Check
                        key={prefix}
                        type="checkbox"
                        label={prefix}
                        checked={selectedPrefixes.includes(prefix)}
                        onChange={(e) => {
                        const updated = e.target.checked
                            ? [...selectedPrefixes, prefix]
                            : selectedPrefixes.filter((p) => p !== prefix);
                        setSelectedPrefixes(updated);
                        }}
                    />
                    ))}
                </div>
            </Form.Group>
        )}

        <Button variant="primary" onClick={handleSubmit} className="mb-4">
            Submit
        </Button>

        {statType === "distribution" ? (
  Object.entries(semesterData).map(([semester, courseCounts]) => {
    const filteredEntries = Object.entries(courseCounts).filter(([id]) => {
      const coursePrefixRaw = id.substring(0, id.lastIndexOf(" "));
      const coursePrefix = coursePrefixRaw.replace(/[_ ]/g, "").toUpperCase();
      const normalizedSelected = selectedPrefixes.map((p) =>
        p.replace(/[_ ]/g, "").toUpperCase()
      );
      return selectedPrefixes.length === 0 || normalizedSelected.includes(coursePrefix);
    });

    if (filteredEntries.length === 0) return null;

    const labels = filteredEntries.map(([id]) => id);
    const values = filteredEntries.map(([, value]) => value);

    const chartData = {
      labels,
      datasets: [
        {
          data: values,
          backgroundColor: [
            "#FF6384",
            "#36A2EB",
            "#FFCE56",
            "#4BC0C0",
            "#9966FF",
            "#FF9F40",
          ],
        },
      ],
    };

    return (
      <div key={semester} className="mb-5">
        <h4>{semester}</h4>
        <div style={{ maxWidth: "600px", margin: "0 auto" }}>
          <Bar
            data={chartData}
            options={{
              responsive: true,
              plugins: {
                legend: { display: false },
              },
              scales: {
                x: { title: { display: true, text: "Course" } },
                y: { title: { display: true, text: "Percentage of Students" }, max: 100, beginAtZero: true },
              },
            }}
          />
        </div>
      </div>
    );
  })
) : (
  Object.entries(semesterData).filter(([courseId]) => {
    const coursePrefixRaw = courseId.substring(0, courseId.lastIndexOf(" "));
    const coursePrefix = coursePrefixRaw.replace(/[_ ]/g, "").toUpperCase();
    const normalizedSelected = selectedPrefixes.map((p) =>
      p.replace(/[_ ]/g, "").toUpperCase()
    );
    return selectedPrefixes.length === 0 || normalizedSelected.includes(coursePrefix);
  }).map(([courseId, gradeCounts]) => {
    const labels = Object.keys(gradeCounts);
    const values = Object.values(gradeCounts);

    const chartData = {
      labels,
      datasets: [
        {
          data: values,
          backgroundColor: [
            "#FF6384",
            "#36A2EB",
            "#FFCE56",
            "#4BC0C0",
            "#9966FF",
            "#FF9F40",
          ],
        },
      ],
    };

    return (
      <div key={courseId} className="mb-5">
        <h4>{courseId}</h4>
        <div style={{ maxWidth: "600px", margin: "0 auto" }}>
          <Bar
            data={chartData}
            options={{
              responsive: true,
              plugins: {
                legend: { display: false },
              },
              scales: {
                x: { title: { display: true, text: "Grade" } },
                y: { title: { display: true, text: "Percentage of Students" }, max: 100, beginAtZero: true },
              },
            }}
          />
        </div>
      </div>
    );
  })
)}

    </div>
  );
}

export default Statistics;
