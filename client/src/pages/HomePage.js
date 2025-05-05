import React from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/global.css";
import "../styles/index.css";


function HomePage() {
  return (
    <div className="container mt-5 text-center">
      <h1>Welcome to the Student Course Visualizer!</h1>
      <p className="lead mb-5">Track and compare your course data with ease.</p>
      <hr className="my-5" />
      <h2 className="mb-3">How does it work?</h2>
      <p className="lead mb-5">Create an account with your UMSystem email, login, and navigate to the form page. 
        From there you can upload a pdf of your transcript, or manually enter your classes. 
        You'll be able to see a visual chart of the classes you've taken each semester as well as the courses other students have taken.</p>
      <p className="lead mb-5">The 'Visualizer' tab allows users to select themselves, a single random user, or all users and view what courses have been taken and what semester they were taken in.</p>
      <p className="lead mb-5">The 'Statistics' tab allows users to select a major and view course distribution by semester or grade.</p>
      <p className="lead mb-5">To upload your own data, login to your account, navigate to the form page, select your major, and upload your pdf for quick results. Instructions to download your transcript can be found below.</p>
      <hr className="my-5" />
      <h2 className="mb-3">New Here?</h2>
      <p className="lead mb-5">
        Create an account with your UMSystem email{" "}
        <Link to="/signup" style={{ color: "#0d6efd" }}>
          here
        </Link>.
      </p>
      <hr className="my-5" />
      <h2 className="mb-3">Downloading Transcript</h2>
      <ol className="lead text-start mx-auto mb-5" style={{ maxWidth: "700px" }}>
        <li>
          Navigate to the MizzouOne page at{" "}
          <a
            href="https://mizzouone.missouri.edu/"
            target="_blank"
            rel="noopener noreferrer"
          >
            https://mizzouone.missouri.edu/
          </a>.
        </li>
        <li>In the search bar, type “audit” and click the search button.</li>
        <li>Select the “Request a Degree Audit” task.</li>
        <li>
          Click the button labeled “Run Declared Programs” in the bottom left
          corner of the page.
        </li>
        <li>Select your degree in the “Programs” column.</li>
        <li>
          Click “2-column PDF” in the top right corner of the page. This will
          download the PDF file of your degree that you can submit in the form
          page to upload your current progress.
        </li>
      </ol>
    </div>
  );
}

export default HomePage;
