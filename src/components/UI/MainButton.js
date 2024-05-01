import MyButton from './MyButton';
import styled from "styled-components";

const MainButton = styled(MyButton)`
    background-image: linear-gradient(to top right, #B334E6, #527BE5);
    width: 300px;
    padding-top: 20px;
    padding-bottom: 20px;
    
    transition: all 300ms ease;
    box-shadow: none;
    transform: scale(1);
    font-size: 20px;
    margin-bottom: 70px;

    &:hover {
        box-shadow: inset 0px 1px 0px 0px rgba(255, 255, 255, 0.4),
                    0px 2px 80px 0px #B334E6;
        transform: scale(1.1);
        font-size: 21px;
        margin-bottom: 69px;
    }
`;

export default MainButton;
