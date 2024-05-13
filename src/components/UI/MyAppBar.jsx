import React, {useContext, useState} from 'react';
import {IconButton, TextField} from "@mui/material";
import {NavRoutes} from "../../utils/consts";
import TextLink from "./TextLink";
import logo from '../../assets/logo.jpeg'
import DoneIcon from '@mui/icons-material/Done';
import CloseIcon from '@mui/icons-material/Close';
import {observer} from "mobx-react-lite";
import {Context} from "../../index";

const MyAppBar = () => {
    const {store} = useContext(Context);

    const [newUsername, setNewUsername] = useState('');
    const [isInput, setIsInput] = useState(false);

    const handleInput = () => {
        setNewUsername(store.username);
        setIsInput(true);
    };

    const handleSave = async () => {
        if (!newUsername.trim() || newUsername.length > 10) {
            alert('Никнейм должен быть не пустым и не более 10 символов');
            return;
        }
        await store.setUsername(newUsername);
        setIsInput(false);
    };

    const handleClose = () => {
        setIsInput(false);
    }

    const saveButton = (
        <IconButton
            size='small'
            onClick={handleSave}
            sx={{
                color: 'green',
                backgroundColor: '#e8f5e9',
                '&:hover': {backgroundColor: '#c8e6c9'}
            }}
        >
            <DoneIcon/>
        </IconButton>
    );

    const closeButton = (
        <IconButton
            size='small'
            onClick={handleClose}
            sx={{
                color: 'red',
                backgroundColor: '#ffebee',
                '&:hover': {
                    backgroundColor: '#ffcdd2'
                }
            }}
        >
            <CloseIcon/>
        </IconButton>
    );


    return (
        <div style={{
            color: "black",
            display: "flex",
            height: 70,
            justifyContent: "space-around",
            borderBottom: '1px solid rgba(235, 235, 235, 1)',
            width: "100%",
            position: 'relative'
        }}>
            <div style={{display: "flex"}}>
                <img style={{marginRight: 30}} src={logo} alt={'logo'} width={70}
                     height={'auto'}/>
                <div style={{display: "flex", alignItems: "center"}}>
                    {NavRoutes.map((route, index) => (
                        <TextLink to={route.path} text={route.name} sx={{margin: '0 10px 0 10px'}} key={index}/>))
                    }
                </div>
            </div>
            <div style={{display: "flex", alignItems: "center"}}>
                {isInput ?
                    <div style={{display: "flex", alignItems: "center"}}>
                        <TextField
                            size="small"
                            variant="outlined"
                            label="Ник"
                            value={newUsername}
                            onChange={(e) => {
                                if (e.target.value.length <= 10) {
                                    setNewUsername(e.target.value);
                                }
                            }}
                            sx={{
                                '& .MuiInputBase-root': {
                                    fontSize: '0.875rem',
                                    padding: '0 10px 0 0 '
                                },
                                width: 120,
                                marginRight: 1,
                            }}
                            margin={'none'}
                        />
                        {closeButton}
                        <span style={{marginRight: 4}}/>
                        {saveButton}
                    </div>
                    :
                    <div className={'textlink'} onClick={handleInput}>
                        {store.username}
                    </div>
                    // здесь еще картинка и нажимаешь она меняется на вариант из бекнда
                }
            </div>
            <div style={{position: "absolute", left: 15, top: 25}}>
                beta-test2.0
            </div>
        </div>
    );
};

export default observer(MyAppBar);