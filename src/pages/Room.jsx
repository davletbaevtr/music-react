import React, {useContext, useEffect, useState} from 'react';
import {useParams} from 'react-router-dom';
import {Alert, CircularProgress, Slide, Snackbar, TextField} from "@mui/material";
import MyButton from "../components/UI/MyButton";
import {observer} from "mobx-react-lite";
import {Context} from "../index";
import {API_URL, WS_API_URL} from "../utils/consts";
import AddPlaylistDialog from "../components/UI/AddPlaylistDialog";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import Plus from '../assets/plus.svg'
import Profile from '../assets/profile.svg'
import Remove from '../assets/remove.svg'

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
    const [countdown, setCountdown] = useState(0);

    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(0);

    const [audioTitle, setAudioTitle] = useState('');
    const [audioArtists, setAudioArtists] = useState([]);

    const [knowButtonVisible, setKnowButtonVisible] = useState(false);

    const [showAnswer, setShowAnswer] = useState(false);

    const [audioImg, setAudioImg] = useState(null);

    const handleMessage = (event) => {
        const result = JSON.parse(event.data);
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
                    } else if (result.update_seats.action === "remove") {
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
                setAudioUrl(result.message.url);
                setAudioTitle(result.message.title)
                setAudioArtists(result.message.artists)
                setAudioImg(result.message.cover_uri)
                setShowAnswer(false);
                break;
            case 'round_update':
                setRoomData(previousData => {
                    return {
                        ...previousData,
                        round: result.round
                    };
                });
                break;
            case 'i_know_create':
                setRoomData(previousData => {
                    return {
                        ...previousData,
                        i_know_pause: result.message
                    };
                });

                const audio = document.getElementById('audioPlayer');
                if (!audio.paused) {
                    audio.pause();
                }
                break;
            case 'i_know_delete':
                setRoomData(previousData => {
                    return {
                        ...previousData,
                        i_know_pause: null
                    };
                });
                const audio1 = document.getElementById('audioPlayer');
                setRoomData(previousData => {
                    return {
                        ...previousData,
                        scores: result.message.scores
                    };
                });
                if (result.message.answer === 'wrong') {
                    if (audio1.paused) {
                        audio1.play();
                    }
                } else {
                    setKnowButtonVisible(false);
                    setShowAnswer(true);
                }
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
                    setKnowButtonVisible(true);
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
        if (volume !== 0) {
            localStorage.setItem('volume', volume.toString());
        }
    }, [volume]);

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

        const handleAudioFinish = () => {
            setShowAnswer(true);
        };

        if (audio) {
            audio.addEventListener('ended', handleAudioFinish);
        }

        return () => {
            if (audio) {
                audio.removeEventListener('ended', handleAudioFinish);
            }
        };
    }, [audioUrl]);

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
        console.log(store.user_id);
        const ws = new WebSocket(wsUrl);
        setAudioUrl('');

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

    const handleAnswer = (action) => {
        if (websocket && websocket.readyState === WebSocket.OPEN) {
            const message = JSON.stringify({type: 'answer', user_id: store.user_id, action: action});
            websocket.send(message);
        }
    }

    const handleIKnow = () => {
        if (websocket && websocket.readyState === WebSocket.OPEN) {
            const message = JSON.stringify({type: 'i_know', user_id: store.user_id});
            websocket.send(message);
        }
    }

    useEffect(() => {
        const handleKeyPress = (event) => {
            if (event.key === 'Enter') {
                document.getElementById('i_know').click();
            }
        };

        document.addEventListener('keypress', handleKeyPress);

        return () => {
            document.removeEventListener('keypress', handleKeyPress);
        };
    }, []);

    const handleVolumeToggle = () => {
        if (volume === 0) {
            const savedVolume = parseFloat(localStorage.getItem('volume'));
            setVolume(savedVolume || 0.1); // Если в storage ничего нет, устанавливаем 0.1
        } else {
            setVolume(0);
        }
    };

    const handleStartOver = () => {
        if (websocket && websocket.readyState === WebSocket.OPEN) {
            const message = JSON.stringify({type: 'start_over', user_id: store.user_id});
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
                                        minWidth: 170,
                                        cursor: roomData.seats && roomData.seats[0] == null ? "pointer" : 'default'
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
                                        <div style={{
                                            display: "flex",
                                            flexDirection: "column",
                                            justifyContent: 'end',
                                            height: '100%',
                                            textAlign: "center"
                                        }}>
                                            <img src={Profile} alt='profile' height={100}
                                                 style={{marginBottom: 5}}/>
                                            <div
                                                style={{
                                                    fontSize: 25,
                                                    backgroundColor: "#527BE5",
                                                    borderRadius: 10,
                                                    color: "white",
                                                    paddingBottom: 3,
                                                    marginLeft: 10,
                                                    marginRight: 10
                                                }}
                                            >
                                                {roomData.usernames && roomData.usernames[0]}
                                            </div>
                                            <div
                                                style={{
                                                    fontSize: 25,
                                                    color: "#527BE5",
                                                    marginBottom: 5
                                                }}
                                            >
                                                Ведущий
                                            </div>
                                        </div>
                                        :
                                        <div style={{
                                            display: "flex",
                                            flexDirection: "column",
                                            justifyContent: "center",
                                            alignItems: "center",
                                            height: '100%'
                                        }}>
                                            <img src={Plus} alt='plus' className='plus'/>
                                        </div>
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
                                                    style={{
                                                        padding: '10px',
                                                        borderBottom: '1px solid #ccc',
                                                        display: "flex",
                                                        flexDirection: "column"
                                                    }}
                                                >

                                                    <div style={{fontSize: 20, display: "flex"}}>
                                                        <div>
                                                            {key}.
                                                        </div>
                                                        <div style={{
                                                            marginLeft: 5,
                                                            display: "flex",
                                                            alignItems: "center",
                                                            justifyContent: "space-between",
                                                            width: '100%'
                                                        }}>
                                                            <div>
                                                                {value.name}
                                                            </div>
                                                            {roomData && roomData.round === 0 &&
                                                                <img
                                                                    src={Remove}
                                                                    alt='remove'
                                                                    height={30}
                                                                    onClick={() => handleRemovePlaylist(key)}
                                                                    style={{cursor: "pointer"}}
                                                                />
                                                            }
                                                        </div>
                                                    </div>
                                                    <div style={{marginTop: 2}}>
                                                        Кол-во треков: {value.playlist_len}
                                                    </div>
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
                                                            <div style={{
                                                                display: "flex",
                                                                flexDirection: "column",
                                                                height: '100%',
                                                                alignItems: "center",
                                                                justifyContent: "center",
                                                                fontSize: 40,
                                                                textAlign: "center",
                                                                fontWeight: 600
                                                            }}>
                                                                <div>
                                                                    Игра еще не началась
                                                                </div>
                                                                <div style={{marginBottom: 15}}>
                                                                    Добавляй свой плейлист
                                                                </div>
                                                                <AddPlaylistDialog roomId={roomId}/>
                                                                <span style={{marginBottom: 10}}></span>
                                                            </div>
                                                    )
                                                    :
                                                    <div style={{
                                                        fontSize: 40,
                                                        textAlign: "center",
                                                        height: '100%',
                                                        justifyContent: "center",
                                                        display: "flex",
                                                        flexDirection: "column",
                                                        fontWeight: 600
                                                    }}>
                                                        <div>
                                                            Игра еще не началась
                                                        </div>
                                                        <div style={{marginBottom: 30}}>
                                                            Займите свободное место
                                                        </div>
                                                    </div>
                                            )
                                            :
                                            roomData.round <= roomData.max_rounds ?
                                                (
                                                    <>
                                                        {roomData && roomData.seats.includes(store.user_id) &&
                                                            <Dialog
                                                                open={roomData.i_know_pause}
                                                                disableBackdropClick={true}
                                                                disableEscapeKeyDown={true}
                                                            >
                                                                <DialogTitle id="alert-dialog-title">
                                                                    Отвечает {roomData.i_know_pause ? `${roomData.i_know_pause.username}` : ''}
                                                                </DialogTitle>
                                                                <DialogContent>
                                                                    <DialogContentText id="alert-dialog-description">
                                                                        здесь полоска отсчета таймера в будущем
                                                                    </DialogContentText>
                                                                    {roomData.seats && roomData.seats[0] === store.user_id &&
                                                                        <div>
                                                                            {audioImg &&
                                                                                <img
                                                                                    src={audioImg}
                                                                                    alt='audio img'
                                                                                    width={30}
                                                                                    height={30}
                                                                                    style={{borderRadius: 5}}
                                                                                />
                                                                            }
                                                                            <div style={{fontSize: 20}}>
                                                                                title: {audioTitle}
                                                                            </div>
                                                                            <div style={{fontSize: 20}}>
                                                                                artists:
                                                                                {audioArtists.map((name) => (
                                                                                    ` ${name}, `
                                                                                ))}
                                                                            </div>
                                                                            <MyButton
                                                                                onClick={() => handleAnswer('right')}>
                                                                                Правильно
                                                                            </MyButton>
                                                                            <MyButton
                                                                                onClick={() => handleAnswer('wrong')}>
                                                                                Неправильно
                                                                            </MyButton>
                                                                        </div>
                                                                    }
                                                                </DialogContent>
                                                            </Dialog>
                                                        }
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
                                                                    {countdown} секунд(ы)
                                                                </div>
                                                            )}

                                                            {showAnswer ?
                                                                <div style={{display: "flex"}}>
                                                                    {audioImg &&
                                                                        <img
                                                                            src={audioImg}
                                                                            alt='audio img'
                                                                            width={300}
                                                                            height={300}
                                                                            style={{borderRadius: 10}}
                                                                        />
                                                                    }
                                                                    <div>
                                                                        <div style={{fontSize: 20}}>
                                                                            {audioTitle}
                                                                        </div>
                                                                        <div style={{fontSize: 16}}>
                                                                            {audioArtists.map((name) => (
                                                                                ` ${name}, `
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                :
                                                                <>
                                                                    {duration === 0 ?
                                                                        <div style={{height: 15}}></div>
                                                                        :
                                                                        <div style={{
                                                                            width: '100%',
                                                                            height: 15,
                                                                            minHeight: 15,
                                                                            backgroundColor: '#ddd'
                                                                        }}>
                                                                            <div style={{
                                                                                height: '100%',
                                                                                backgroundColor: 'blue',
                                                                                width: `${(currentTime / duration) * 100}%`
                                                                            }}/>
                                                                        </div>
                                                                    }
                                                                    {roomData.seats && roomData.seats[0] === store.user_id &&
                                                                        <div style={{display: "flex"}}>
                                                                            {audioImg &&
                                                                                <img
                                                                                    src={audioImg}
                                                                                    alt='audio img'
                                                                                    width={200}
                                                                                    height={200}
                                                                                    style={{borderRadius: 10}}
                                                                                />
                                                                            }
                                                                            <div>
                                                                                <div style={{fontSize: 20}}>
                                                                                    {audioTitle}
                                                                                </div>
                                                                                <div style={{fontSize: 16}}>
                                                                                    {audioArtists.map((name) => (
                                                                                        ` ${name}, `
                                                                                    ))}
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    }
                                                                    <div>
                                                                        <label className="slider">
                                                                            <input type="range"
                                                                                   className="level"
                                                                                   value={volume}
                                                                                   min="0"
                                                                                   max="0.5"
                                                                                   step="0.005"
                                                                                   onChange={(e) => {
                                                                                       if (e.target.value > 0.01) {
                                                                                           setVolume(parseFloat(e.target.value))
                                                                                       } else {
                                                                                           setVolume(0)
                                                                                       }
                                                                                   }}
                                                                            />
                                                                            <div onClick={handleVolumeToggle}>
                                                                                {volume === 0 ?
                                                                                    <svg
                                                                                        viewBox="0 0 576 512"
                                                                                        xmlns="http://www.w3.org/2000/svg"
                                                                                        height="50"
                                                                                        className="volume">
                                                                                        <path
                                                                                            d="M301.1 34.8C312.6 40 320 51.4 320 64V448c0 12.6-7.4 24-18.9 29.2s-25 3.1-34.4-5.3L131.8 352H64c-35.3 0-64-28.7-64-64V224c0-35.3 28.7-64 64-64h67.8L266.7 40.1c9.4-8.4 22.9-10.4 34.4-5.3zM425 167l55 55 55-55c9.4-9.4 24.6-9.4 33.9 0s9.4 24.6 0 33.9l-55 55 55 55c9.4 9.4 9.4 24.6 0 33.9s-24.6 9.4-33.9 0l-55-55-55 55c-9.4 9.4-24.6 9.4-33.9 0s-9.4-24.6 0-33.9l55-55-55-55c-9.4-9.4-9.4-24.6 0-33.9s24.6-9.4 33.9 0z"></path>
                                                                                    </svg>
                                                                                    :
                                                                                    <svg
                                                                                        viewBox="0 0 448 512"
                                                                                        xmlns="http://www.w3.org/2000/svg"
                                                                                        className="volume"
                                                                                        height="50"
                                                                                        style={{marginRight: 20}}
                                                                                    >
                                                                                        <path
                                                                                            d="M301.1 34.8C312.6 40 320 51.4 320 64V448c0 12.6-7.4 24-18.9 29.2s-25 3.1-34.4-5.3L131.8 352H64c-35.3 0-64-28.7-64-64V224c0-35.3 28.7-64 64-64h67.8L266.7 40.1c9.4-8.4 22.9-10.4 34.4-5.3zM412.6 181.5C434.1 199.1 448 225.9 448 256s-13.9 56.9-35.4 74.5c-10.3 8.4-25.4 6.8-33.8-3.5s-6.8-25.4 3.5-33.8C393.1 284.4 400 271 400 256s-6.9-28.4-17.7-37.3c-10.3-8.4-11.8-23.5-3.5-33.8s23.5-11.8 33.8-3.5z"></path>
                                                                                    </svg>
                                                                                }
                                                                            </div>
                                                                        </label>
                                                                    </div>
                                                                    {roomData.seats && roomData.seats.slice(1).includes(store.user_id) && knowButtonVisible &&
                                                                        <MyButton
                                                                            id='i_know'
                                                                            onClick={handleIKnow}
                                                                        >
                                                                            Я знаю
                                                                        </MyButton>
                                                                    }
                                                                </>
                                                            }
                                                            {roomData.seats && roomData.seats[0] === store.user_id &&
                                                                <MyButton onClick={handleNextTrack}>
                                                                    Следующий трек
                                                                </MyButton>
                                                            }
                                                        </div>
                                                    </>
                                                )
                                                :

                                                <div style={{
                                                    display: "flex",
                                                    flexDirection: "column",
                                                    height: '100%',
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    fontSize: 40,
                                                    textAlign: "center",
                                                    fontWeight: 600
                                                }}>
                                                    <div>
                                                        Игра закончилась
                                                    </div>
                                                    <div style={{marginBottom: 15}}>
                                                        ScoreBoard soon...
                                                    </div>
                                                    {roomData.seats && roomData.seats[0] === store.user_id &&
                                                        <MyButton onClick={handleStartOver}>
                                                            Начать заново
                                                        </MyButton>
                                                    }
                                                    <span style={{marginBottom: 10}}></span>
                                                </div>

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
                                    <div style={{height: '100%', textAlign: "center", fontSize: 20}}>
                                        Чат soon..
                                    </div>
                                </div>
                            </div>
                            <div style={{
                                display: "flex",
                                height: 320,
                                marginTop: 30,
                                width: "100%",
                                justifyContent: "center",
                            }}>
                                <span style={{marginLeft: 30}}></span>
                                {roomData.seats && roomData.seats?.slice(1).map((seat, index) => (
                                    <div
                                        style={{
                                            boxShadow: '0 0 5px 1px rgba(0, 0, 0, 0.2)',
                                            height: 200,
                                            width: 170,
                                            borderRadius: 30,
                                            marginRight: 20,
                                            cursor: roomData.seats[index + 1] == null ? "pointer" : 'default'
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
                                            <div style={{
                                                display: "flex",
                                                flexDirection: "column",
                                                justifyContent: 'end',
                                                height: '100%',
                                                textAlign: "center"
                                            }}>
                                                <img src={Profile} alt='profile' height={100}
                                                     style={{marginBottom: 5}}/>
                                                <div
                                                    style={{
                                                        fontSize: 25,
                                                        backgroundColor: "#527BE5",
                                                        borderRadius: 10,
                                                        color: "white",
                                                        paddingBottom: 3,
                                                        marginLeft: 10,
                                                        marginRight: 10
                                                    }}
                                                >
                                                    {roomData.usernames && roomData.usernames[index + 1]}
                                                </div>
                                                <div
                                                    style={{
                                                        fontSize: 35,
                                                        color: "#527BE5",
                                                        marginTop: -5
                                                    }}
                                                >
                                                    {roomData.scores && roomData.scores[index + 1]}
                                                </div>
                                            </div>
                                            :
                                            <div style={{
                                                display: "flex",
                                                flexDirection: "column",
                                                justifyContent: "center",
                                                alignItems: "center",
                                                height: '100%'
                                            }}>
                                                <img src={Plus} alt='plus' className='plus'/>
                                            </div>
                                        }
                                    </div>
                                ))}
                                {(roomData.creator === store.user_id || (roomData.seats && roomData.seats[0] === store.user_id)) &&
                                    <div style={{margin: '10px'}}>
                                        <MyButton
                                            onClick={() => handleSeatUpdate('add')}
                                            style={{width: 170, minWidth: 170, marginBottom: 10}}
                                        >
                                            Добавить стул
                                        </MyButton>
                                        <MyButton
                                            onClick={() => handleSeatUpdate('remove')}
                                            style={{width: 170, minWidth: 170}}
                                        >
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
