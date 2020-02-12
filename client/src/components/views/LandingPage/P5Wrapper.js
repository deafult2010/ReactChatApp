import React, { useState, useEffect } from 'react';
import _p5 from 'p5/lib/p5.min';
import PropTypes from 'prop-types';

const P5Wrapper = props => {
  // eslint-disable-next-line
  const [p5, setP5] = useState(0);
  const wrapper = React.createRef();

  useEffect(() => {
    setP5(new _p5(props.sketch, wrapper.current));
    // eslint-disable-next-line
  }, [props.sketch]);

  return <div ref={wrapper} />;
};

P5Wrapper.propTypes = {
  sketch: PropTypes.func
};

export default P5Wrapper;
