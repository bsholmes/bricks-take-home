import styled from 'styled-components';

 const ToolbarButton = ({
  image,
  selected,
  onClick = () => {}  
}) => {
  return <ButtonImage src={image} onClick={onClick} selected={selected} />
};

const ButtonImage = styled.img`
  filter: ${props => props.selected ? 'invert(1)' : 'none'};
  margin: 4px;
  border: 1px solid #222222;

`;

export default ToolbarButton;
