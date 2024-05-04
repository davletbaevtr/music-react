import React, {useContext, useEffect, useState} from 'react';
import {useParams} from 'react-router-dom';
import {Alert, CircularProgress, Slide, Snackbar, TextField} from "@mui/material";
import MyButton from "../components/UI/MyButton";
import {observer} from "mobx-react-lite";
import {Context} from "../index";
import {API_URL, WS_API_URL} from "../utils/consts";
import AddPlaylistDialog from "../components/UI/AddPlaylistDialog";

function SlideTransition(props) {
    return <Slide {...props} direction="up"/>;
}

const Room = () => {
    const {store} = useContext(Context);
    const [password, setPassword] = useState('');
    const {roomId} = useParams();
    const [isSuccessAuth, setIsSuccessAuth] = useState(false);
    const [websocket, setWebsocket] = useState(null);
    const [firstIsLoading, setFirstIsLoading] = useState(true);
    const [roomData, setRoomData] = useState({});
    const [authIsLoading, setAuthIsLoading] = useState(false);
    const [needReconnect, setNeedReconnect] = useState(false);
    const [authError, setAuthError] = useState(false);
    const [audioUrl, setAudioUrl] = useState('');
    const [countdown, setCountdown] = useState(null);

    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(0);

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
                    const updatedUsernames = [...previousData.usernames];
                    const updatedScores = [...previousData.scores]
                    const index_remove = result.player_seat_update.index_remove;
                    const index_add = result.player_seat_update.index_add;

                    if (index_remove != null) {
                        updatedSeats[index_remove] = null;
                        updatedUsernames[index_remove] = null;
                        updatedScores[index_remove] = null
                    }
                    if (index_add != null) {
                        updatedSeats[index_add] = result.player_seat_update.user_id;
                        updatedUsernames[index_add] = result.player_seat_update.username;
                        updatedScores[index_add] = result.player_seat_update.score;
                    }

                    return {
                        ...previousData,
                        seats: updatedSeats,
                        usernames: updatedUsernames,
                        scores: updatedScores
                    };
                });
                break;
            case 'update_seats':
                setRoomData(previousData => {
                    const updatedSeats = [...previousData.seats]
                    const updatedUsernames = [...previousData.usernames];
                    const updatedScores = [...previousData.scores]
                    if (result.update_seats.action === "add") {
                        updatedSeats.push(null);
                        updatedUsernames.push(null);
                        updatedScores.push(null);
                    } else if (result.update_seats.action === "remove" && updatedSeats.length > 2) {
                        updatedSeats.pop();
                        updatedUsernames.pop();
                        updatedScores.pop()
                    }
                    return {
                        ...previousData,
                        seats: updatedSeats,
                        usernames: updatedUsernames,
                        scores: updatedScores
                    };
                });
                break;
            case 'usernames_update':
                const {index, username} = result.usernames_update;
                setRoomData(previousData => {
                    const updatedUsernames = [...previousData.usernames];
                    if (index !== -1) {
                        updatedUsernames[index] = username;
                    }
                    return {
                        ...previousData,
                        usernames: updatedUsernames
                    };
                });
                break;
            case 'playlists_update':
                const {number, name, playlist_len} = result.playlists_update;
                setRoomData(previousData => {
                    const updatedPlaylists = {...previousData.playlists}
                    updatedPlaylists[number] = {name: name, playlist_len: playlist_len}
                    return {
                        ...previousData,
                        playlists: updatedPlaylists
                    }
                });
                break;
            case 'playlists_delete':
                const {number: deleteNumber} = result.playlists_delete;
                setRoomData(previousData => {
                    const updatedPlaylists = {...previousData.playlists};
                    delete updatedPlaylists[deleteNumber];
                    return {
                        ...previousData,
                        playlists: updatedPlaylists
                    };
                });
                break;
            case 'music_url_update':
                setAudioUrl(result.url);
                break;
            case 'round_update':
                setRoomData(previousData => {
                    return {
                        ...previousData,
                        round: result.round
                    };
                });
                break;
            default:
                // Обрабатывайте другие типы сообщений или ошибки
                break;
        }
    };

    useEffect(() => {
        const audio = document.getElementById('audioPlayer');
        if (audioUrl) {
            console.log(audioUrl);

            setCountdown(3); // Установка таймера на 3 секунды
            const interval = setInterval(() => {
                setCountdown((currentCountdown) => {
                    if (currentCountdown <= 1) {
                        clearInterval(interval); // Очистка интервала, когда таймер достигает 0
                        return 0;
                    }
                    return currentCountdown - 1;
                });
            }, 1000);

            if (audio) {
                audio.load();
                setTimeout(() => {
                    audio.play().catch(error => console.log("Ошибка воспроизведения:", error));
                }, 3000);

                audio.onerror = () => {
                    console.error("Ошибка загрузки аудио");
                };
            } else {
                console.log("Элемент audio не найден в DOM");
            }
        }
        return () => {
            if (audio) {
                audio.pause();
                audio.currentTime = 0;
            }
        };
    }, [audioUrl]);

    useEffect(() => {
        const audio = document.getElementById('audioPlayer');

        const setAudioData = () => {
            setDuration(audio.duration);
        };

        const updateCurrentTime = () => {
            setCurrentTime(audio.currentTime);
        };

        if (audio) {
            audio.addEventListener('loadedmetadata', setAudioData);
            audio.addEventListener('timeupdate', updateCurrentTime);
        }

        return () => {
            if (audio) {
                audio.removeEventListener('loadedmetadata', setAudioData);
                audio.removeEventListener('timeupdate', updateCurrentTime);
            }
        };
    }, []);

    useEffect(() => {
        const audio = document.getElementById('audioPlayer');
        if (audio) {
            audio.volume = volume;
            if (audio.muted) {
                audio.muted = false;
            }
        }

    }, [volume]);

    const checkFirstPassword = () => {
        const wsUrl = `${WS_API_URL}/ws/rooms/${roomId}/?user_id=${store.user_id}&password=${password}`;
        const ws = new WebSocket(wsUrl);

        ws.onmessage = handleMessage;

        ws.onopen = () => {
            setFirstIsLoading(false);
            setIsSuccessAuth(true);
            setNeedReconnect(false);
            console.log('WebSocket connected');
            setWebsocket(ws);
        };

        ws.onclose = () => {
            setNeedReconnect(true);
            setFirstIsLoading(false);
            console.log('дисконект');
        };
    }

    const checkPassword = () => {
        setAuthIsLoading(true);
        setAuthError(false);
        const wsUrl = `${WS_API_URL}/ws/rooms/${roomId}/?user_id=${store.user_id}&password=${password}`;
        const ws = new WebSocket(wsUrl);

        ws.onmessage = handleMessage;

        ws.onopen = () => {
            setAuthIsLoading(false);
            setIsSuccessAuth(true);
            setNeedReconnect(false);
            console.log('WebSocket connected');
            setWebsocket(ws);
        };

        ws.onclose = () => {
            setNeedReconnect(true);
            setAuthIsLoading(false);
            setAuthError(true);
            console.log('дисконект')
        };
    }

    useEffect(() => {
        store.room_id = roomId;
        checkFirstPassword();
        return () => {
            store.room_id = -1
        }
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
    };

    const handleRemovePlaylist = (number) => {
        if (websocket && websocket.readyState === WebSocket.OPEN) {
            const message = JSON.stringify({
                type: 'remove_playlist',
                number: number,
                user_id: store.user_id,
            });
            websocket.send(message);
        }
    };

    const handleSeatUpdate = (action) => {
        if (websocket && websocket.readyState === WebSocket.OPEN) {
            const message = JSON.stringify({type: 'update_seats', action: action, user_id: store.user_id});
            websocket.send(message);
        }
    };

    const handleCloseSnackbar = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }
        setIsSuccessAuth(false);
        setFirstIsLoading(true);
        setNeedReconnect(false);
        checkFirstPassword();
    };

    const handleNextTrack = () => {
        if (websocket && websocket.readyState === WebSocket.OPEN) {
            const message = JSON.stringify({type: 'next_track', user_id: store.user_id});
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
            <video id='audioPlayer' muted hidden>
                <source src={`${API_URL}${audioUrl}`} type="audio/mp3"/>
                Your browser does not support the audio element.
            </video>
            {firstIsLoading ?
                <CircularProgress/>
                :
                (isSuccessAuth ?
                        <>
                            <Snackbar
                                open={needReconnect}
                                autoHideDuration={6000}
                                onClose={handleCloseSnackbar}
                                anchorOrigin={{vertical: 'top', horizontal: 'center'}}
                                TransitionComponent={SlideTransition}
                                sx={{marginTop: 10}}
                            >
                                <Alert
                                    onClose={handleCloseSnackbar}
                                    severity="error"
                                    variant="filled"
                                    sx={{width: '100%'}}
                                >
                                    Связь оборвалась, переподключаемся
                                </Alert>
                            </Snackbar>
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
                                    {roomData.seats && roomData.seats[0]
                                        ?
                                        <div>{roomData.usernames[0]}</div>
                                        :
                                        'плюс'
                                    }
                                </div>
                                <div style={{
                                    display: "flex",
                                    flexDirection: "row",
                                    justifyContent: "center",
                                    alignItems: 'end',
                                    flexGrow: 1
                                }}>
                                    <div
                                        style={{
                                            boxShadow: '0 0 5px 1px rgba(0, 0, 0, 0.2)',
                                            height: 420,
                                            borderRadius: 30,
                                            marginRight: 30,
                                            width: 250,
                                            overflow: "auto"
                                        }}
                                        className={'custom-scroll'}
                                    >
                                        {roomData.playlists && Object.keys(roomData.playlists).length > 0 ?
                                            Object.entries(roomData.playlists).map(([key, value]) => (
                                                <div
                                                    key={key}
                                                    style={{padding: '10px', borderBottom: '1px solid #ccc'}}
                                                >
                                                    {key}
                                                    {value.name}
                                                    {value.playlist_len}
                                                    <MyButton onClick={() => handleRemovePlaylist(key)}>
                                                        remove
                                                    </MyButton>
                                                </div>
                                            ))
                                            : <div style={{padding: '10px'}}>Нет плейлистов</div>
                                        }
                                    </div>
                                    <div style={{
                                        boxShadow: '0 0 5px 1px rgba(0, 0, 0, 0.2)',
                                        height: 420,
                                        borderRadius: 30,
                                        flexGrow: 1
                                    }}>
                                        {roomData.round === 0 ?
                                            (
                                                roomData.seats.includes(store.user_id)
                                                    ?
                                                    (
                                                        roomData.seats && roomData.seats[0] === store.user_id
                                                            ?
                                                            (
                                                                roomData.playlists && Object.keys(roomData.playlists).length > 0
                                                                    ?
                                                                    <MyButton onClick={handleNextTrack}>
                                                                        Начать игру
                                                                    </MyButton>
                                                                    :
                                                                    <div>
                                                                        Ожидаем плейлисты от игроков
                                                                    </div>
                                                            )
                                                            :
                                                            <AddPlaylistDialog roomId={roomId}/>
                                                    )
                                                    :
                                                    'Займите любое место'
                                            )
                                            :
                                            (
                                                <div style={{
                                                    display: "flex",
                                                    flexDirection: "column",
                                                    justifyContent: "space-between",
                                                    height: '100%'
                                                }}>
                                                    <div>
                                                        Игра идет<br/> раунд:{roomData.round}
                                                    </div>
                                                    {countdown !== 0 && (
                                                        <div style={{fontSize: 32}}>
                                                            Воспроизведение начнется через: {countdown} секунд(ы)
                                                        </div>
                                                    )}

                                                    <div style={{
                                                        width: '100%',
                                                        height: '20px',
                                                        backgroundColor: '#ddd'
                                                    }}>
                                                        <div style={{
                                                            height: '100%',
                                                            backgroundColor: 'blue',
                                                            width: `${(currentTime / duration) * 100}%`
                                                        }}/>
                                                    </div>
                                                    <div>
                                                        <label>
                                                            Громкость:
                                                            <input
                                                                type="range"
                                                                min="0"
                                                                max="1"
                                                                step="0.01"
                                                                value={volume}
                                                                onChange={(e) => setVolume(parseFloat(e.target.value))}
                                                                style={{verticalAlign: 'middle'}}
                                                            />
                                                        </label>
                                                    </div>

                                                    {roomData.seats && roomData.seats[0] === store.user_id &&
                                                        <MyButton onClick={handleNextTrack}>
                                                            Следующий трек
                                                        </MyButton>
                                                    }
                                                </div>
                                            )
                                        }
                                    </div>
                                </div>
                                <div style={{
                                    boxShadow: '0 0 5px 1px rgba(0, 0, 0, 0.2)',
                                    height: 420,
                                    borderRadius: 30,
                                    marginRight: 30,
                                    width: 250,
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
                                {roomData.seats && roomData.seats?.slice(1).map((seat, index) => (
                                    <div
                                        style={{
                                            boxShadow: '0 0 5px 1px rgba(0, 0, 0, 0.2)',
                                            height: 200,
                                            width: 170,
                                            borderRadius: 30,
                                            marginRight: 20
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
                                        {seat ?
                                            <>
                                                <div>{roomData.usernames && roomData.usernames[index + 1]}</div>
                                                <div>{roomData.scores && roomData.scores[index + 1]}</div>
                                            </>
                                            : 'плюс'
                                        }
                                    </div>
                                ))}
                                {(roomData.creator === store.user_id || (roomData.seats && roomData.seats[0] === store.user_id)) &&
                                    <div style={{margin: '10px'}}>
                                        <MyButton onClick={() => handleSeatUpdate('add')} style={{marginRight: '5px'}}>
                                            Добавить стул
                                        </MyButton>
                                        <MyButton onClick={() => handleSeatUpdate('remove')}
                                                  style={{marginLeft: '5px'}}>
                                            Убрать стул
                                        </MyButton>
                                    </div>
                                }
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
                                onKeyDown={e => {
                                    if (e.key === 'Enter') {
                                        checkPassword();
                                    }
                                }}
                            />
                            {authError &&
                                <div style={{position: "absolute", bottom: 150, color: "red"}}>Неправильно введен
                                    пароль</div>}
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
