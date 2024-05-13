import React, {useContext, useEffect, useState} from 'react';
import Dialog from '@mui/material/Dialog';
import LinearProgress from '@mui/material/LinearProgress';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import MyButton from "./MyButton";
import {TextField} from "@mui/material";
import {observer} from "mobx-react-lite";
import axios from "axios";
import {API_URL} from "../../utils/consts";
import {Context} from "../../index";
import Plus from '../../assets/plus.svg'
import Remove from '../../assets/remove.svg'
import {yupResolver} from "@hookform/resolvers/yup";
import {Controller, useForm} from "react-hook-form";
import {schemaAddPlaylist} from '../../utils/shema'
import {Input} from "./Input";

const AddPlaylistDialog = ({roomId}) => {
    const {store} = useContext(Context);
    const [open, setOpen] = useState(false);
    const [error, setError] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const {control, handleSubmit, watch, setValue, formState: {errors}} = useForm({
        mode: "onBlur",
        resolver: yupResolver(schemaAddPlaylist),
        defaultValues: {
            name: `Плейлист от ${store.username}`,
            urls: ['']
        }
    });

    useEffect(() => {
        setValue('name', `Плейлист от ${store.username}`);
    }, [store.username]);

    const handleClickOpen = () => {
        setOpen(true);
    };

    const handleClose = () => {
        setError(false);
        setValue('urls', ['']);
        setOpen(false);
        setIsLoading(false);
    };

    const addPlaylist = async (data) => {
        try {
            setError(false);
            setIsLoading(true);
            await axios.post(`${API_URL}/api/add_playlist/`, {...data, room_id: roomId});
            handleClose();
        } catch (error) {
            setError(true);
        } finally {
            setIsLoading(false);
        }
    }

    const urls = watch('urls');

    const handleAddMoreUrl = () => {
        setValue('urls', [...urls, '']);
    };

    const handleRemoveUrl = index => {
        const newUrls = [...urls];
        newUrls.splice(index, 1);
        setValue('urls', newUrls);
    };

    return (
        <>
            <MyButton onClick={handleClickOpen} style={{width: 300}}>
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
                <DialogContent style={{display: "flex", flexDirection: "column", alignItems: "center"}}>
                    <DialogContentText id="alert-dialog-description">
                        Мы поддерживаем в данный момент плейлисты из сервисов:<br/>1) yandex music<br/>2) spotify
                    </DialogContentText>
                    <form noValidate onSubmit={handleSubmit(addPlaylist)} style={{width: '100%', display: "flex", flexDirection: "column", alignItems: "center"}}>
                        <Controller
                            name="name"
                            control={control}
                            render={({field}) => (
                                <Input
                                    {...field}
                                    label="Название плейлиста"
                                    fullWidth
                                    error={!!errors.name}
                                    helperText={errors.name?.message}
                                    autoComplete="off"
                                    style={{marginTop: 20, marginBottom: 5}}
                                    required
                                />
                            )}
                        />
                        {urls.map((item, index) => (
                            <div key={item.id}
                                 style={{display: "flex", width: '100%', position: "relative", alignItems: "center"}}>
                                <Controller
                                    name={`urls.${index}`}
                                    control={control}
                                    render={({field}) => (
                                        <Input
                                            {...field}
                                            label="Вставьте ссылку"
                                            fullWidth
                                            error={!!errors.urls?.[index]}
                                            helperText={errors.urls?.[index]?.message}
                                            style={{marginTop: 5, marginBottom: 5}}
                                            InputProps={{
                                                style: {
                                                    paddingRight: 25,
                                                }
                                            }}
                                        />
                                    )}
                                />
                                <img src={Remove} alt={'убрать ссылку'} width={25} height={25}
                                     style={{position: "absolute", right: 8, cursor: "pointer", top: 20}}
                                     onClick={() => handleRemoveUrl(index)}/>
                            </div>
                        ))}
                        <div style={{
                            display: "flex",
                            flexDirection: "row",
                            alignItems: "center",
                            cursor: "pointer",
                            marginTop: 10
                        }} onClick={handleAddMoreUrl}>
                            <img src={Plus} alt={'добавить еще ссылку'} width={20} height={20}/>
                            <div style={{color: 'rgba(0, 0, 0, 0.5)', marginLeft: 5}}>
                                Добавить еще ссылку
                            </div>
                        </div>
                        {error &&
                            <div style={{color: "red", marginTop: 10}}>
                                Произошла ошибка
                            </div>
                        }
                        {isLoading && <LinearProgress style={{width: '100%', marginTop: 20}}/>}
                        <MyButton
                            type='submit'
                            style={{paddingTop: 15, paddingBottom: 15, marginTop: 20}}
                        >
                            {urls.length > 1 ? 'Добавить как один' : 'Добавить плейлист'}
                        </MyButton>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}

export default observer(AddPlaylistDialog)