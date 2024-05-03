import React, {useContext, useState} from 'react';
import Dialog from '@mui/material/Dialog';
import LinearProgress from '@mui/material/LinearProgress';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import MyButton from "./MyButton";
import {TextField} from "@mui/material";
import {Context} from "../../index";
import {observer} from "mobx-react-lite";
import axios from "axios";
import {API_URL} from "../../utils/consts";

const AddPlaylistDialog = ({roomId}) => {
    const {store} = useContext(Context);
    const [open, setOpen] = useState(false);
    const [url, setUrl] = useState('');
    const [playlistName, setPlaylistName] = useState(`Плейлист от ${store.username}`);
    const [error, setError] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleClickOpen = () => {
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
    };

    const addPlaylist = async () => {
        try {
            setError(false);
            setIsLoading(true);
            await axios.post(`${API_URL}/api/add_playlist/`, {name: playlistName, url: url, room_id: roomId});
            handleClose();
        } catch (error) {
            setError(true);
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <>
            <MyButton onClick={handleClickOpen}>
                Добавить плейлист
            </MyButton>
            <Dialog
                open={open}
                onClose={handleClose}
                aria-labelledby="alert-dialog-title"
                aria-describedby="alert-dialog-description"
            >
                <DialogTitle id="alert-dialog-title">
                    Добавить плейлист
                </DialogTitle>
                <DialogContent>
                    <DialogContentText id="alert-dialog-description">
                        Мы поддерживаем в данный момент плейлисты из сервисов:<br/>1) yandex music
                    </DialogContentText>
                    <TextField
                        label="Название плейлиста"
                        fullWidth
                        value={playlistName}
                        onChange={e => setPlaylistName(e.target.value)}
                        type="text"
                        autoComplete="off"
                        sx={{marginTop: 2}}
                    />
                    <TextField
                        label="Вставьте ссылку"
                        fullWidth
                        value={url}
                        onChange={e => setUrl(e.target.value)}
                        type="url"
                        autoComplete="off"
                        sx={{marginTop: 1}}
                    />
                    {error &&
                        <div style={{position: "absolute", bottom: 110, color: "red"}}>
                            Произошла ошибка
                        </div>
                    }
                    {isLoading && <LinearProgress style={{position: "absolute", bottom: 100, left: 30, width: '88%'}}/>}
                    <MyButton onClick={addPlaylist}
                              style={{width: '100%', paddingTop: 15, paddingBottom: 15, marginTop: 60}}>
                        Добавить плейлист
                    </MyButton>
                </DialogContent>
                {/*<DialogActions>*/}
                {/*    <Button onClick={handleClose}>Отменить</Button>*/}
                {/*</DialogActions>*/}
            </Dialog>
        </>
    );
}

export default observer(AddPlaylistDialog)