import React, {useContext, useEffect, useState} from 'react';
import MyButton from "../components/UI/MyButton";
import axios from "axios";
import {API_URL, WS_API_URL} from "../utils/consts";
import {useNavigate} from "react-router-dom";
import {observer} from "mobx-react-lite";
import RoomTable from "../components/UI/RoomTable";
import {Context} from "../index";
import log from 'loglevel';
import {Controller, useForm} from "react-hook-form";
import {schemaCreateRoom} from "../utils/shema";
import {yupResolver} from "@hookform/resolvers/yup";
import {TextField} from "@mui/material";
import {Input} from "../components/UI/Input";

log.setLevel(log.levels.DEBUG);

const Rooms = () => {
    const {store} = useContext(Context);
    const [rooms, setRooms] = useState([]);
    const [roomInfo, setRoomInfo] = useState({});
    const [websocket, setWebsocket] = useState(null);
    const [currentRoomId, setCurrentRoomId] = useState(null);
    const [createRoomError, setCreateRoomError] = useState(false);

    const {control, handleSubmit, setValue, watch, formState: {errors}} = useForm({
        mode: "onBlur",
        resolver: yupResolver(schemaCreateRoom),
        defaultValues: {
            name: '',
            password: '',
            max_rounds: '4',
            players_count: '4'
        }
    });

    const maxRounds = watch('max_rounds');
    const playersCount = watch('players_count');

    useEffect(() => {
        log.debug('Try to connect WebSocket')
        const ws = new WebSocket(`${WS_API_URL}/ws/rooms/info/`);
        ws.onmessage = handleMessage;
        ws.onopen = () => {
            log.debug("WebSocket connected");
        };
        ws.onclose = () => {
            log.debug("WebSocket Closed");
        }
        setWebsocket(ws);

        return () => {
            ws.close();
        };
    }, []);

    const navigate = useNavigate();

    const handleMessage = (event) => {
        const result = JSON.parse(event.data);
        log.debug('ws message from backend', result)
        switch (result.type) {
            case 'update_list':
                setRooms(rooms => [...rooms, result.room]);
                break;
            case 'delete_list':
                setRooms(rooms => rooms.filter(room => room.id !== result.id));
                break;
            case 'initial_list':
                setRooms(result.rooms);
                break;
            case 'room_info':
                setRoomInfo(result.room_info);
                break;
            case 'room_info_update':
                console.log(result)
                setRoomInfo(roomInfo => ({...roomInfo, ...result.room_info_update}));
                break;
            default:
                // Обрабатывайте другие типы сообщений или ошибки
                break;
        }
    };

    const [searchText, setSearchText] = useState('');

    const handleSearchChange = (event) => {
        setSearchText(event.target.value);
    };

    const filteredRooms = searchText ? rooms.filter(row => row.name.toLowerCase().includes(searchText.toLowerCase())) : rooms;


    const handleCreateRoom = async (data) => {
        console.log(data);
        try {
            const response = await axios.post(`${API_URL}/api/create_room/`, {...data, creator: store.user_id});
            navigate(`/rooms/${response.data.id}`);
        } catch (error) {
            setCreateRoomError(true);
        }
    };

    const handleRowClickOuter = (roomId) => {
        if (websocket && websocket.readyState === WebSocket.OPEN) {
            setCurrentRoomId(roomId);
            const message = JSON.stringify({room_id: roomId});
            websocket.send(message);
        }
    };

    const handleConnectRoom = () => {
        navigate(`/rooms/${currentRoomId}`)
    }

    return (
        <div style={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "center",
            flexGrow: 2,
            width: "100%",
            maxWidth: 1200,
            paddingBottom: 20,
            paddingTop: 20
        }}>
            <div style={{
                boxShadow: '0 0 5px 1px rgba(0, 0, 0, 0.2)',
                borderRadius: 30,
                padding: 15,
                width: "55%",
                marginLeft: 20
            }}>
                <TextField
                    sx={{
                        '& .MuiOutlinedInput-root': {
                            borderRadius: '15px'
                        },
                        marginBottom: '15px'
                    }}
                    fullWidth
                    label="Поиск по названию"
                    value={searchText}
                    onChange={handleSearchChange}
                    variant="outlined"
                    placeholder="Введите для поиска..."
                />
                <RoomTable data={filteredRooms} handleRowClickOuter={handleRowClickOuter}/>
            </div>
            <div style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                marginLeft: 40,
                width: "45%",
                marginRight: 20
            }}>
                <div style={{
                    boxShadow: '0 0 5px 1px rgba(0, 0, 0, 0.2)',
                    borderRadius: 30,
                    padding: 15,
                    flexGrow: 1,
                    marginBottom: 30
                }}>
                    {
                        Object.keys(roomInfo).length > 0 ? (
                            <div style={{
                                display: "flex",
                                flexDirection: "column",
                                justifyContent: "space-between",
                                height: "100%"
                            }}>
                                <div>
                                    <div>
                                        Статус: {roomInfo.round === 0 ? 'Ожидание игроков' : `${roomInfo.round}/${roomInfo.max_rounds}`}
                                    </div>
                                    <div>
                                        Игроки: {roomInfo.players.length > 0 ? roomInfo.players : 'Пока никого нет'}
                                    </div>
                                    <div>
                                        Создана: {roomInfo.created_at}
                                    </div>
                                    <div>
                                        Начата: {roomInfo.started_at ? roomInfo.started_at : "Игра не началась"}
                                    </div>
                                </div>
                                <MyButton onClick={handleConnectRoom} style={{padding: '15px 10px'}}>
                                    Присоединиться
                                </MyButton>
                            </div>
                        ) : (
                            <div>Выберите комнату для просмотра информации</div>
                        )
                    }
                </div>
                <div
                    style={{
                        boxShadow: '0 0 5px 1px rgba(0, 0, 0, 0.2)',
                        borderRadius: 30,
                        padding: 15,
                        flexGrow: 1.5,
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                    }}
                >
                    <form noValidate onSubmit={handleSubmit(handleCreateRoom)} style={{display: "flex", flexDirection: "column", alignItems: "center"}}>
                        <Controller
                            name="name"
                            control={control}
                            render={({field}) => (
                                <Input
                                    {...field}
                                    label="Введите название комнаты"
                                    type="text"
                                    error={!!errors.name}
                                    helperText={errors?.name?.message}
                                    required
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: '15px'
                                        },
                                        marginBottom: '0px',
                                        marginTop: '5px'
                                    }}
                                />
                            )}
                        />
                        <Controller
                            name="password"
                            control={control}
                            render={({field}) => (
                                <Input
                                    {...field}
                                    label="Password"
                                    type="password"
                                    error={!!errors.password}
                                    helperText={errors?.password?.message}
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: '15px'
                                        },
                                        marginBottom: '10px'
                                    }}
                                />
                            )}
                        />
                        <Controller
                            name="max_rounds"
                            control={control}
                            render={({field}) => (
                                <div className="rounds-slider-container">
                                    <input {...field} type="range" min="1" max="10" className="range-slider"
                                           id="roundsRange"/>
                                    <div style={{marginTop: 10}} id="roundsValue">Количество
                                        раундов: {maxRounds}</div>
                                </div>
                            )}
                        />
                        <Controller
                            name="players_count"
                            control={control}
                            render={({field}) => (
                                <div className="rounds-slider-container">
                                    <input {...field} type="range" min="1" max="8" className="range-slider"
                                           id="playersCountRange"/>
                                    <div style={{marginTop: 10}} id="playersCountValue">Количество
                                        игроков: {playersCount}</div>
                                </div>
                            )}
                        />
                        <MyButton type="submit" style={{padding: '15px 10px', marginTop: 20}}>
                            Создать комнату
                        </MyButton>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default observer(Rooms);
