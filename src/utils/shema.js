import * as yup from "yup";

const requiredFieldValidationErrorMsg = "Данное поле обязательное"

const urlRegExp = /^(https?:\/\/)?[\w-]+(\.[\w-]+)+([\w.,@?^=%&amp;:/~+#-]*[\w@?^=%&amp;/~+#-])?$/;

const urlFilter = yup
    .string()
    .matches(urlRegExp, 'Введите корректную ссылку')
    .required()
export const schemaCreateRoom = yup.object().shape({
    name: yup
        .string()
        .matches(/^[a-zA-Z0-9а-яА-Я._ ]+$/, 'Название может содержать только буквы, цифры, точки, подчеркивания и пробелы')
        .required(requiredFieldValidationErrorMsg),
});

export const schemaAddPlaylist = yup.object({
    name: yup
        .string()
        .matches(/^[a-zA-Z0-9а-яА-Я._ ]+$/, 'Название может содержать только буквы, цифры, точки, подчеркивания и пробелы')
        .required(requiredFieldValidationErrorMsg),
    urls: yup.array().of(
        urlFilter
    )
});