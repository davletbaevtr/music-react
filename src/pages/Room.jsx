import React, {useContext, useEffect, useRef, useState} from 'react';
import {useParams} from 'react-router-dom';
import {CircularProgress, LinearProgress, TextField} from "@mui/material";
import MyButton from "../components/UI/MyButton";
import {observer} from "mobx-react-lite";
import {Context} from "../index";
import {API_URL} from "../utils/consts";

const Room = () => {
    const {store} = useContext(Context);
    const [password, setPassword] = useState('');
    const {roomId} = useParams();
    const [isSuccessAuth, setIsSuccessAuth] = useState(false);
    const [websocket, setWebsocket] = useState(null);
    const [firstIsLoading, setFirstIsLoading] = useState(true);
    const [roomData, setRoomData] = useState({});
    const [authIsLoading, setAuthIsLoading] = useState(false);

    const handleMessage = (event) => {
        const result = JSON.parse(event.data);
        console.log(result);
        switch (result.type) {
            case 'initial_room':
                setRoomData(result.room_data);
                break;
            case 'player_seat_update':
                setRoomData(previousData => {
                    const updatedSeats = [...previousData.seats];

                    if (result.player_seat_update.index_remove != null) {
                        updatedSeats[result.player_seat_update.index_remove] = null;
                    }
                    if (result.player_seat_update.index_add != null) {
                        updatedSeats[result.player_seat_update.index_add] = result.player_seat_update.user_id;
                    }

                    return {
                        ...previousData,
                        seats: updatedSeats
                    };
                });
                break;
            default:
                // Обрабатывайте другие типы сообщений или ошибки
                break;
        }
    };

    const checkFirstPassword = () => {
        const wsUrl = `ws://${API_URL}/ws/rooms/${roomId}/?user_id=${store.user_id}&password=${password}`;
        const ws = new WebSocket(wsUrl);

        ws.onmessage = handleMessage;

        ws.onopen = () => {
            setFirstIsLoading(false);
            setIsSuccessAuth(true);
            console.log('WebSocket connected');
            setWebsocket(ws);
        };

        ws.onclose = (event) => {
            setFirstIsLoading(false);
            console.log('дисконект')
        };
    }

    const checkPassword = () => {
        setAuthIsLoading(true);
        const wsUrl = `ws://${API_URL}/ws/rooms/${roomId}/?user_id=${store.user_id}&password=${password}`;
        const ws = new WebSocket(wsUrl);

        ws.onmessage = handleMessage;

        ws.onopen = () => {
            setAuthIsLoading(false);
            setIsSuccessAuth(true);
            console.log('WebSocket connected');
            setWebsocket(ws);
        };

        ws.onclose = (event) => {
            setAuthIsLoading(false);
            console.log('дисконект')
        };
    }

    useEffect(() => {
        checkFirstPassword();
    }, []);

    useEffect(() => {
        return () => {
            if (websocket && isSuccessAuth) {
                websocket.close();
            }
        };
    }, [isSuccessAuth, websocket]);

    const handleSeat = (index) => {
        if (websocket && websocket.readyState === WebSocket.OPEN) {
            const message = JSON.stringify({type: 'player_seat', index: index, user_id: store.user_id});
            websocket.send(message);
        }
    }

    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                flexGrow: 2,
                width: "100%",
                alignItems: "center"
            }}
        >
            {firstIsLoading ?
                <CircularProgress/>
                :
                (isSuccessAuth ?
                        <>
                            <div style={{
                                display: "flex",
                                justifyContent: "space-between",
                                height: 450,
                                alignItems: 'end',
                                width: "100%"
                            }}>
                                <div
                                    style={{
                                        boxShadow: '0 0 5px 1px rgba(0, 0, 0, 0.2)',
                                        height: 200,
                                        borderRadius: 30,
                                        marginLeft: 30,
                                        width: 170,
                                        marginRight: 30,
                                        minWidth: 170
                                    }}
                                    key={0}
                                    onClick={
                                        () => {
                                            if (roomData.seats && roomData.seats[0] == null) {
                                                console.log('click')
                                                handleSeat(0)
                                            }
                                        }
                                    }
                                >
                                    {roomData.seats && roomData.seats[0] ? roomData.seats[0] : 'плюс'}
                                </div>
                                <div style={{
                                    display: "flex",
                                    flexDirection: "row",
                                    justifyContent: "center",
                                    alignItems: 'end',
                                    flexGrow: 1
                                }}>
                                    <div style={{
                                        boxShadow: '0 0 5px 1px rgba(0, 0, 0, 0.2)',
                                        height: 420,
                                        borderRadius: 30,
                                        marginRight: 30,
                                        flexGrow: 0.18
                                    }}>
                                        плейлисты
                                    </div>
                                    <div style={{
                                        boxShadow: '0 0 5px 1px rgba(0, 0, 0, 0.2)',
                                        height: 420,
                                        borderRadius: 30,
                                        flexGrow: 1
                                    }}>
                                        центр
                                    </div>
                                </div>
                                <div style={{
                                    boxShadow: '0 0 5px 1px rgba(0, 0, 0, 0.2)',
                                    height: 420,
                                    borderRadius: 30,
                                    marginRight: 30,
                                    flexGrow: 0.25,
                                    marginLeft: 30
                                }}>
                                    чат
                                </div>
                            </div>
                            <div style={{
                                display: "flex",
                                height: 320,
                                marginTop: 30,
                                width: "100%",
                                justifyContent: "center"
                            }}>
                                {roomData.seats?.slice(1).map((seat, index) => (
                                    <div
                                        style={{
                                            boxShadow: '0 0 5px 1px rgba(0, 0, 0, 0.2)',
                                            height: 200,
                                            width: 170,
                                            borderRadius: 30
                                        }}
                                        key={index + 1}
                                        onClick={
                                            () => {
                                                if (roomData.seats[index + 1] == null) {
                                                    console.log('click')
                                                    handleSeat(index + 1)
                                                }
                                            }
                                        }
                                    >
                                        {seat ? seat : 'плюс'}
                                    </div>
                                ))}
                            </div>
                        </>
                        :
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                borderRadius: 30,
                                boxShadow: '0 0 5px 1px rgba(0, 0, 0, 0.2)',
                                width: 500,
                                height: 330,
                                marginBottom: 100,
                                position: "relative"
                            }}
                        >
                            {authIsLoading && <CircularProgress style={{position: "absolute", bottom: 120}}/>}
                            <div style={{fontSize: 32, fontWeight: 700, marginBottom: 20, marginTop: 30}}>
                                Введите пароль
                            </div>
                            <TextField
                                label="Введите пароль"
                                variant="outlined"
                                fullWidth
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                type="password"
                                autoComplete="off"
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: '15px'
                                    },
                                    marginBottom: '90px',
                                    width: 400
                                }}
                            />
                            <MyButton onClick={checkPassword} style={{padding: '15px 70px'}}>
                                Присоедениться
                            </MyButton>
                        </div>
                )
            }
        </div>
    );
};

export default observer(Room);
