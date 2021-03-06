import React from 'react';
// import { FaCode } from 'react-icons/fa';
import P5Wrapper from './P5Wrapper';
import sketch1 from './sketches/sketch1';

function LandingPage() {
  return (
    <>
      <div className='App'>
        <h1>Hello p5.js in React</h1>
        <P5Wrapper sketch={sketch1} />
      </div>
      {/* <div className="app">
            <FaCode style={{ fontSize: '4rem' }} /><br />
            <span style={{ fontSize: '2rem' }}>Let's Start Coding!</span>
        </div> */}
      {/* <div style={{ float:'right' }}>Thanks For Using This Boiler Plate by John Ahn</div> */}
    </>
  );
}

export default LandingPage;
