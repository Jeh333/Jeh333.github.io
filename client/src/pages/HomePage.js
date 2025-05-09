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
      <p className="lead mb-5">Create an account with your UMSystem email, log in, and navigate to the form page. 
        From there you can upload a pdf of your transcript, or manually enter your courses. 
        You will be able to see a visual chart of the courses you've taken each semester as well as the courses other students have taken.</p>
      <p className="lead mb-5">The 'Visualizer' tab allows you to select yourself, a random anonymous user, or all users to view what courses have been taken and what semester they were taken in.</p>
      <p className="lead mb-5">The 'Statistics' tab allows you to select a major and view course distribution by semester or grade.</p>
      <p className="lead mb-5">The 'Edit' tab allows you to edit or delete courses uploaded to your account.</p>
      <p className="lead mb-5">To upload your own data, log in to your account, navigate to the form page, select your major, and upload a pdf of your transcript for quick results. Instructions to download your transcript can be found below.</p>
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
      <hr className="my-5" />
      <h2 className="mb-3">Why does the page look frozen?</h2>
      <p className="lead mb-5">The server may need to start if used infrequently! This can take up to a minute.</p>
    </div>
  );
}

export default HomePage;
