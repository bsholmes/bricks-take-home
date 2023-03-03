import { useState } from 'react';
import styled from 'styled-components';

import IconCanvas from './IconCanvas';
import Toolbar from './Toolbar/Toolbar';

import SelectTool from '../tools/SelectTool';
import AddTool from '../tools/AddTool';
import ConnectTool from '../tools/ConnectTool';

const TOOL_MAP = [
  new SelectTool(),
  new AddTool(),
  new ConnectTool()
];

export const App = () => {
  const [toolMode, setToolMode] = useState(0);
  const currentTool = TOOL_MAP[toolMode];

  const onToolChange = (index) => {
    currentTool.onToolChange && currentTool.onToolChange();
    setToolMode(index);
  };

  return (
    <Container id='App'>
      <Toolbar toolMode={toolMode} onToolChange={onToolChange} />
      <IconCanvas tool={currentTool} />
    </Container>
  );
};

const Container = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: center;
`;
