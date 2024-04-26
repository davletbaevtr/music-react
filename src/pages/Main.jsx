import React from 'react';
import {ROOMS_ROUTE} from "../utils/consts";
import {useNavigate} from "react-router-dom";
import MainButton from "../components/UI/MainButton";
import MouseParticleTrail from "../components/UI/MouseParticleTrail";
import {observer} from "mobx-react-lite";

const Main = () => {
    const navigate = useNavigate();
    const handleClick = () => {
        navigate(ROOMS_ROUTE);
    }

    return (
        <div style={{position: 'relative', flexGrow: 2, display: "flex"}}>
            <MouseParticleTrail/>
            <div style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                marginLeft: 20,
                marginRight: 20,
                justifyContent: "center",
                flexGrow: 2,
            }}>
                <div style={{textAlign: "center", fontSize: 36, fontWeight: 800, marginTop: 5, zIndex: 10}}>
                    Присоединяйтесь к увлекательной<br/>музыкальной викторине с друзьями!
                </div>
                <div style={{textAlign: "center", fontSize: 24, fontWeight: 600, marginTop: 20, marginBottom: 70, zIndex: 10}}>
                    Подключитесь к игре с друзьями, отправьте свой плейлист<br/>и попробуйте угадать случайные песни из
                    плейлистов каждого участника.<br/>За каждую угаданную песню вы получите баллы.<br/>Проверьте свои
                    музыкальные знания и весело проведите время!
                </div>
                {/*здесь картинка кратко показывающее геймплей*/}
                <MainButton
                    style={{zIndex: 10}}
                    onClick={handleClick}
                >
                    Играть
                </MainButton>
            </div>
        </div>
    );
};

export default observer(Main);