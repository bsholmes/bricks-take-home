import { useState } from 'react';
import styled from 'styled-components';

import IconCanvas from "./IconCanvas";
import Toolbar from "./Toolbar/Toolbar";

export const App = () => {
  const [toolMode, setToolMode] = useState(0);
  return (
    <Container id='App'>
      <Toolbar toolMode={toolMode} onToolChange={setToolMode} />
      <IconCanvas toolMode={toolMode} />
    </Container>
  );
};

const Container = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: center;
`;