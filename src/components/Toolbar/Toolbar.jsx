import styled from 'styled-components';

import ToolbarButton from './ToolbarButton';

import SelectIcon from '../../static/select_icon.svg';
import AddIcon from '../../static/add_icon.svg';
import ConnectIcon from '../../static/connect_icon.svg';

const IMAGE_MAP = [
  SelectIcon,
  AddIcon,
  ConnectIcon
];

const Toolbar = ({
  toolMode,
  onToolChange = () => {}
}) => {

  return (
    <Container>
      {IMAGE_MAP.map((image, index) => (
        <ToolbarButton
          key={index} // index is okay as a key here because our array is constant
          image={image}
          onClick={() => {onToolChange(index);}}
          selected={toolMode === index}
          />
      ))}
    </Container>
  );
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: start;
  border: 2px solid #000000;
  border-radius: 4px;
  margin-right: 4px;
`;

export default Toolbar;
