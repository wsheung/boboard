import React from 'react';
import Main from './Main';
import './App.css';


// if (process.env.NODE_ENV === 'development') {
//   const whyDidYouRender = require('@welldone-software/why-did-you-render');
//   whyDidYouRender(React);
// }

function App() {
  return (
    <div className="App">
      <Main />
    </div>
  );
}

export default App;
