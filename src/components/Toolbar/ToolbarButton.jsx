import styled from 'styled-components';

const ToolbarButton = ({
  image,
  selected,
  onClick = () => {}
}) => {
  return <ButtonImage src={image} onMouseDown={onClick} selected={selected} />;
};

const ButtonImage = styled.img`
  filter: ${props => props.selected ? 'invert(1)' : 'none'};
  margin: 4px;
  border: 1px solid #222222;
  border-radius: 4px;
  overflow: hidden;
  transition: filter 0.15s linear;

  &:hover {
    filter: ${props => props.selected ? 'invert(0.8)' : 'invert(0.2)'};
  }
`;

export default ToolbarButton;
