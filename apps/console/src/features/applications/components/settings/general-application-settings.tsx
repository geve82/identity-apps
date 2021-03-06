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

import { hasRequiredScopes } from "@wso2is/core/helpers";
import { AlertLevels, SBACInterface, TestableComponentInterface } from "@wso2is/core/models";
import { addAlert } from "@wso2is/core/store";
import {
    ConfirmationModal,
    ContentLoader,
    DangerZone,
    DangerZoneGroup,
    EmphasizedSegment
} from "@wso2is/react-components";
import React, { FunctionComponent, ReactElement, useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { Divider } from "semantic-ui-react";
import { AppState, FeatureConfigInterface } from "../../../core";
import { deleteApplication, updateApplicationDetails } from "../../api";
import { ApplicationManagementConstants } from "../../constants";
import {
    ApplicationInterface,
    ApplicationTemplateListItemInterface,
    CertificateInterface
} from "../../models";
import { GeneralDetailsForm } from "../forms";

/**
 * Proptypes for the applications general details component.
 */
interface GeneralApplicationSettingsInterface extends SBACInterface<FeatureConfigInterface>,
    TestableComponentInterface {

    /**
     * Application access URL.
     */
    accessUrl?: string;
    /**
     * Currently editing application id.
     */
    appId?: string;
    /**
     * Application description.
     */
    description?: string;
    /**
     * Is the application discoverable.
     */
    discoverability?: boolean;
    /**
     * Application logo URL.
     */
    imageUrl?: string;
    /**
     * Is the application info request loading.
     */
    isLoading?: boolean;
    /**
     * Name of the application.
     */
    name: string;
    /**
     * Callback to be triggered after deleting the application.
     */
    onDelete: () => void;
    /**
     * Callback to update the application details.
     */
    onUpdate: (id: string) => void;
    /**
     * Application template.
     */
    template?: ApplicationTemplateListItemInterface;
    /**
     * Current certificate configurations.
     */
    certificate: CertificateInterface;
}

/**
 * Component to edit general details of the application.
 *
 * @param {GeneralApplicationSettingsInterface} props - Props injected to the component.
 *
 * @return {ReactElement}
 */
export const GeneralApplicationSettings: FunctionComponent<GeneralApplicationSettingsInterface> = (
    props: GeneralApplicationSettingsInterface
): ReactElement => {

    const {
        appId,
        name,
        description,
        discoverability,
        featureConfig,
        imageUrl,
        accessUrl,
        isLoading,
        onDelete,
        onUpdate,
        certificate,
        [ "data-testid" ]: testId
    } = props;

    const dispatch = useDispatch();

    const { t } = useTranslation();

    const allowedScopes: string = useSelector((state: AppState) => state?.auth?.scope);

    const [showDeleteConfirmationModal, setShowDeleteConfirmationModal] = useState<boolean>(false);

    /**
     * Deletes an application.
     */
    const handleApplicationDelete = (): void => {
        deleteApplication(appId)
            .then(() => {
                dispatch(addAlert({
                    description: t("devPortal:components.applications.notifications.deleteApplication.success" +
                        ".description"),
                    level: AlertLevels.SUCCESS,
                    message: t("devPortal:components.applications.notifications.deleteApplication.success.message")
                }));

                setShowDeleteConfirmationModal(false);
                onDelete();
            })
            .catch((error) => {
                if (error.response && error.response.data && error.response.data.description) {
                    dispatch(addAlert({
                        description: error.response.data.description,
                        level: AlertLevels.ERROR,
                        message: t("devPortal:components.applications.notifications.deleteApplication.error" +
                            ".message")
                    }));

                    return;
                }

                dispatch(addAlert({
                    description: t("devPortal:components.applications.notifications.deleteApplication" +
                        ".genericError.description"),
                    level: AlertLevels.ERROR,
                    message: t("devPortal:components.applications.notifications.deleteApplication.genericError" +
                        ".message")
                }));
            });
    };

    /**
     * Handles form submit action.
     *
     * @param {ApplicationInterface} updatedDetails - Form values.
     */
    const handleFormSubmit = (updatedDetails: ApplicationInterface): void => {
        updateApplicationDetails(updatedDetails)
            .then(() => {
                dispatch(addAlert({
                    description: t("devPortal:components.applications.notifications.updateApplication.success" +
                        ".description"),
                    level: AlertLevels.SUCCESS,
                    message: t("devPortal:components.applications.notifications.updateApplication.success.message")
                }));

                onUpdate(appId);
            })
            .catch((error) => {
                if (error.response && error.response.data && error.response.data.description) {
                    dispatch(addAlert({
                        description: error.response.data.description,
                        level: AlertLevels.ERROR,
                        message: t("devPortal:components.applications.notifications.updateApplication.error" +
                            ".message")
                    }));

                    return;
                }

                dispatch(addAlert({
                    description: t("devPortal:components.applications.notifications.updateApplication" +
                        ".genericError.description"),
                    level: AlertLevels.ERROR,
                    message: t("devPortal:components.applications.notifications.updateApplication.genericError" +
                        ".message")
                }));
            });
    };

    /**
     * Resolves the danger actions.
     *
     * @return {React.ReactElement} DangerZoneGroup element.
     */
    const resolveDangerActions = (): ReactElement => {
        if (!hasRequiredScopes(
            featureConfig?.applications, featureConfig?.applications?.scopes?.update, allowedScopes)) {
            return null;
        }

        if (ApplicationManagementConstants.DELETING_FORBIDDEN_APPLICATIONS.includes(name)) {
            return null;
        }

        if (hasRequiredScopes(
            featureConfig?.applications, featureConfig?.applications?.scopes?.delete, allowedScopes)) {
            return (
                <DangerZoneGroup sectionHeader={ t("devPortal:components.applications.dangerZoneGroup.header") }>
                    {
                        hasRequiredScopes(
                            featureConfig?.applications, featureConfig?.applications?.scopes?.delete, allowedScopes) &&
                        (
                            <DangerZone
                                actionTitle={
                                    t("devPortal:components.applications.dangerZoneGroup.deleteApplication" +
                                        ".actionTitle")
                                }
                                header={
                                    t("devPortal:components.applications.dangerZoneGroup.deleteApplication.header")
                                }
                                subheader={
                                    t("devPortal:components.applications.dangerZoneGroup.deleteApplication" +
                                        ".subheader")
                                }
                                onActionClick={ (): void => setShowDeleteConfirmationModal(true) }
                                data-testid={ `${ testId }-danger-zone` }
                            />
                        )
                    }
                </DangerZoneGroup>
            );
        }

        return null;
    };

    return (
        !isLoading
            ? (
                <>
                    <EmphasizedSegment>
                        <GeneralDetailsForm
                            certificate={ certificate }
                            name={ name }
                            appId={ appId }
                            description={ description }
                            discoverability={ discoverability }
                            onSubmit={ handleFormSubmit }
                            imageUrl={ imageUrl }
                            accessUrl={ accessUrl }
                            readOnly={
                                !hasRequiredScopes(
                                    featureConfig?.applications, featureConfig?.applications?.scopes?.update,
                                    allowedScopes
                                )
                            }
                            data-testid={ `${ testId }-form` }
                        />
                    </EmphasizedSegment>
                    <Divider hidden />
                    { resolveDangerActions() }
                    <ConfirmationModal
                        onClose={ (): void => setShowDeleteConfirmationModal(false) }
                        type="warning"
                        open={ showDeleteConfirmationModal }
                        assertion={ name }
                        assertionHint={ (
                            <p>
                                <Trans
                                    i18nKey={
                                        "devPortal:components.applications.confirmations.deleteApplication" +
                                        ".assertionHint"
                                    }
                                    tOptions={ { name: name } }
                                >
                                    Please type <strong>{ name }</strong> to confirm.
                                </Trans>
                            </p>
                        ) }
                        assertionType="input"
                        primaryAction={ t("common:confirm") }
                        secondaryAction={ t("common:cancel") }
                        onSecondaryActionClick={ (): void => setShowDeleteConfirmationModal(false) }
                        onPrimaryActionClick={ (): void => handleApplicationDelete() }
                        data-testid={ `${ testId }-application-delete-confirmation-modal` }
                    >
                        <ConfirmationModal.Header
                            data-testid={ `${ testId }-application-delete-confirmation-modal-header` }
                        >
                            { t("devPortal:components.applications.confirmations.deleteApplication.header") }
                        </ConfirmationModal.Header>
                        <ConfirmationModal.Message
                            attached
                            warning
                            data-testid={ `${ testId }-application-delete-confirmation-modal-message` }
                        >
                            { t("devPortal:components.applications.confirmations.deleteApplication.message") }
                        </ConfirmationModal.Message>
                        <ConfirmationModal.Content
                            data-testid={ `${ testId }-application-delete-confirmation-modal-content` }
                        >
                            { t("devPortal:components.applications.confirmations.deleteApplication.content") }
                        </ConfirmationModal.Content>
                    </ConfirmationModal>
                </>
            )
            : <ContentLoader/>
    );
};

/**
 * Default props for the application general settings component.
 */
GeneralApplicationSettings.defaultProps = {
    "data-testid": "application-general-settings"
};
