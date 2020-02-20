/**
 * Copyright (c) 2020, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
 *
 * WSO2 Inc. licenses this file to you under the Apache License,
 * Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import { Heading, LinkButton, PrimaryButton, Steps } from "@wso2is/react-components";
import _ from "lodash";
import React, { FunctionComponent, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import { Grid, Icon, Modal } from "semantic-ui-react";
import { addUser } from "../../../api";
import { ApplicationWizardStepIcons } from "../../../configs";
import { AlertLevels } from "../../../models";
import { addAlert } from "../../../store/actions";
import { AddUser } from "../add-user";
import { AddUserWizardSummary } from "./wizard-summary";
import { useTrigger } from "@wso2is/forms";

interface AddUserWizardPropsInterface {
    closeWizard: () => void;
    currentStep?: number;
    listOffset: number;
    listItemLimit: number;
    updateList: () => void;
}

/**
 * Interface for the wizard state.
 */
interface WizardStateInterface {
    [ key: string ]: any;
}

/**
 * Enum for wizard steps form types.
 * @readonly
 * @enum {string}
 */
enum WizardStepsFormTypes {
    GENERAL_SETTINGS = "GeneralDetails",
    SUMMARY = "summary"
}

/**
 * User creation wizard.
 *
 * @return {JSX.Element}
 */
export const AddUserWizard: FunctionComponent<AddUserWizardPropsInterface> = (
    props: AddUserWizardPropsInterface
): JSX.Element => {

    const {
        updateList,
        closeWizard,
        currentStep,
    } = props;

    const { t } = useTranslation();
    const dispatch = useDispatch();

    const [submitGeneralSettings, setSubmitGeneralSettings] = useTrigger();
    const [finishSubmit, setFinishSubmit] = useTrigger();

    const [ completedStep, setCompletedStep ] = useState<number>(undefined);
    const [ partiallyCompletedStep, setPartiallyCompletedStep ] = useState<number>(undefined);
    const [ currentWizardStep, setCurrentWizardStep ] = useState<number>(currentStep);
    const [ wizardState, setWizardState ] = useState<WizardStateInterface>(undefined);

    /**
     * Sets the current wizard step to the next on every `completedStep`
     * value change , and resets the completed step value.
     */
    useEffect(() => {
        if (completedStep === undefined) {
            return;
        }

        if ((currentWizardStep + 1) === STEPS.length) {
            return;
        }
        setCurrentWizardStep(currentWizardStep + 1);
        setCompletedStep(undefined);
    }, [ completedStep ]);

    /**
     * Sets the current wizard step to the previous on every `partiallyCompletedStep`
     * value change , and resets the partially completed step value.
     */
    useEffect(() => {
        if (partiallyCompletedStep === undefined) {
            return;
        }

        setCurrentWizardStep(currentWizardStep - 1);
        setPartiallyCompletedStep(undefined);
    }, [ partiallyCompletedStep ]);

    const navigateToNext = () => {
        switch (currentWizardStep) {
            case 0:
                setSubmitGeneralSettings();
                break;
            case 1:
                setFinishSubmit();
        }
    };

    const navigateToPrevious = () => {
        setPartiallyCompletedStep(currentWizardStep);
    };

    /**
     * This function handles adding the user.
     */
    const addUserBasic = (userInfo: any) => {
        let userName = "";
        userInfo.domain !== "primary" ? userName = userInfo.domain + "/" + userInfo.userName : userName =
            userInfo.userName;
        let userDetails = {};
        const password = userInfo.newPassword;

        userInfo.passwordOption && userInfo.passwordOption !== "askPw" ?
            (
                userDetails = {
                    emails:
                        [{
                            primary: true,
                            value: userInfo.email
                        }],
                    name:
                        {
                            familyName: userInfo.lastName,
                            givenName: userInfo.firstName
                        },
                    password,
                    userName
                }
            ) :
            (
                userDetails = {
                    "emails":
                        [{
                            primary: true,
                            value: userInfo.email
                        }],
                    "name":
                        {
                            familyName: userInfo.lastName,
                            givenName: userInfo.firstName
                        },
                    "password": "password",
                    "urn:ietf:params:scim:schemas:extension:enterprise:2.0:User":
                        {
                            askPassword: "true"
                        },
                    userName
                }
            );

        addUser(userDetails)
            .then(() => {
                dispatch(addAlert({
                    description: t(
                        "views:components.users.notifications.addUser.success.description"
                    ),
                    level: AlertLevels.SUCCESS,
                    message: t(
                        "views:components.users.notifications.addUser.success.message"
                    )
                }));
                updateList();
                closeWizard();
            })
            .catch((error) => {
                // Axios throws a generic `Network Error` for 401 status.
                // As a temporary solution, a check to see if a response
                // is available has be used.
                if (!error.response || error.response.status === 401) {
                    dispatch(addAlert({
                        description: t(
                            "views:components.users.notifications.addUser.error.description"
                        ),
                        level: AlertLevels.ERROR,
                        message: t(
                            "views:components.users.notifications.addUser.error.message"
                        )
                    }));
                } else if (error.response && error.response.data && error.response.data.detail) {

                    dispatch(addAlert({
                        description: t(
                            "views:components.users.notifications.addUser.error.description",
                            { description: error.response.data.detail }
                        ),
                        level: AlertLevels.ERROR,
                        message: t(
                            "views:components.users.notifications.addUser.error.message"
                        )
                    }));
                } else {
                    // Generic error message
                    dispatch(addAlert({
                        description: t(
                            "views:components.users.notifications.addUser.genericError.description"
                        ),
                        level: AlertLevels.ERROR,
                        message: t(
                            "views:components.users.notifications.addUser.genericError.message"
                        )
                    }));
                }
            });
    };

    /**
     * Handles wizard step submit.
     *
     * @param values - Forms values to be stored in state.
     * @param {WizardStepsFormTypes} formType - Type of the form.
     */
    const handleWizardFormSubmit = (values: any, formType: WizardStepsFormTypes) => {
        setCurrentWizardStep(currentWizardStep + 1);
        setWizardState(_.merge(wizardState, { [ formType ]: values }));
    };

    /**
     * Generates a summary of the wizard.
     *
     * @return {any}
     */
    const generateWizardSummary = () => {
        if (!wizardState) {
            return;
        }

        let summary = {};

        for (const value of Object.values(wizardState)) {
            summary = {
                ...summary,
                ...value
            };
        }

        return _.merge(_.cloneDeep(summary));
    };

    const handleWizardFormFinish = (user: any) => {
        addUserBasic(user);
    };

    const STEPS = [
        {
            content: (
                <AddUser
                    isRoleModalOpen={ null }
                    handleRoleModalClose={ null }
                    handleRoleModalOpen={ null }
                    triggerSubmit={ submitGeneralSettings }
                    initialValues={ wizardState && wizardState[ WizardStepsFormTypes.GENERAL_SETTINGS ] }
                    onSubmit={ (values) => handleWizardFormSubmit(values, WizardStepsFormTypes.GENERAL_SETTINGS) }
                />
            ),
            icon: ApplicationWizardStepIcons.general,
            title: "Basic user details"
        },
        {
            content: (
                <AddUserWizardSummary
                    triggerSubmit={ finishSubmit }
                    onSubmit={ handleWizardFormFinish }
                    summary={ generateWizardSummary() }
                />
            ),
            icon: ApplicationWizardStepIcons.general,
            title: "Summary"
        }
    ];

    return (
        <Modal
            open={ true }
            className="wizard application-create-wizard"
            dimmer="blurring"
            size="small"
            onClose={ closeWizard }
            closeOnDimmerClick
            closeOnEscape
        >
            <Modal.Header className="wizard-header">
                Add user
                <Heading as="h6">Create a new user in the system</Heading>
            </Modal.Header>
            <Modal.Content className="steps-container">
                <Steps.Group header="Fill the following mandatory details of the user." current={ currentWizardStep }>
                    { STEPS.map((step, index) => (
                        <Steps.Step
                            key={ index }
                            icon={ step.icon }
                            title={ step.title }
                        />
                    )) }
                </Steps.Group>
            </Modal.Content>
            <Modal.Content className="content-container" scrolling>
                { STEPS[ currentWizardStep ].content }
            </Modal.Content>
            <Modal.Actions>
                <Grid>
                    <Grid.Row column={ 1 }>
                        <Grid.Column mobile={ 8 } tablet={ 8 } computer={ 8 }>
                            <LinkButton floated="left" onClick={ () => closeWizard() }>Cancel</LinkButton>
                        </Grid.Column>
                        <Grid.Column mobile={ 8 } tablet={ 8 } computer={ 8 }>
                            { currentWizardStep < STEPS.length - 1 && (
                                <PrimaryButton floated="right" onClick={ navigateToNext }>
                                    Next Step <Icon name="arrow right"/>
                                </PrimaryButton>
                            ) }
                            { currentWizardStep === STEPS.length - 1 && (
                                <PrimaryButton floated="right" onClick={ navigateToNext }>
                                    Finish</PrimaryButton>
                            ) }
                            { currentWizardStep > 0 && (
                                <LinkButton floated="right" onClick={ navigateToPrevious }>
                                    <Icon name="arrow left"/> Previous step
                                </LinkButton>
                            ) }
                        </Grid.Column>
                    </Grid.Row>
                </Grid>
            </Modal.Actions>
        </Modal>
    );
};

/**
 * Default props for the add user wizard.
 */
AddUserWizard.defaultProps = {
    currentStep: 0
};