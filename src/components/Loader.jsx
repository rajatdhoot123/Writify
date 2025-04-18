import React from 'react';

const loaderStyle = {
  width: '16px',
  padding: '8px',
  aspectRatio: '1',
  borderRadius: '50%',
  background: '#25b09b',
  '--_m': 'conic-gradient(#0000 10%,#000), linear-gradient(#000 0 0) content-box',
  WebkitMask: 'var(--_m)',
  mask: 'var(--_m)',
  WebkitMaskComposite: 'source-out',
  maskComposite: 'subtract',
  animation: 'l3 1s infinite linear',
};

const SOURCE_COLOR = {
  slack: '#25b09b',
  twitter: '#fff',
};

const keyframesL3 = `@keyframes l3 { to { transform: rotate(1turn) } }`;

// eslint-disable-next-line react/prop-types
const Loader = ({ source = 'twitter' }) => {
  return (
    <>
      <style>{keyframesL3}</style>
      <div className="loader" style={{ ...loaderStyle, backgroundColor: SOURCE_COLOR[source] }}></div>
    </>
  );
};

export default Loader;
