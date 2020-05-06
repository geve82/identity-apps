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

import { AlertLevels, LoadableComponentInterface } from "@wso2is/core/models";
import { addAlert } from "@wso2is/core/store";
import {
    AppAvatar,
    ConfirmationModal,
    EmptyPlaceholder,
    LinkButton,
    PrimaryButton,
    ResourceList
} from "@wso2is/react-components";
import React, { FunctionComponent, ReactElement, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Icon } from "semantic-ui-react";
import { deleteIdentityProvider } from "../../api";
import { EmptyPlaceholderIllustrations } from "../../configs";
import { UIConstants } from "../../constants";
import { history } from "../../helpers";
import {
    ConfigReducerStateInterface,
    IdentityProviderListResponseInterface,
    StrictIdentityProviderInterface
} from "../../models";
import { AppState } from "../../store";

/**
 * Proptypes for the identity provider list component.
 */
interface IdentityProviderListPropsInterface extends LoadableComponentInterface {
    /**
     * IdP list.
     */
    list: IdentityProviderListResponseInterface;
    /**
     * Callback to be fired when clicked on the empty list placeholder action.
     */
    onEmptyListPlaceholderActionClick: () => void;
    /**
     * On IdP delete callback.
     */
    onIdentityProviderDelete: () => void;
    /**
     * Callback for the search query clear action.
     */
    onSearchQueryClear: () => void;
    /**
     * Search query for the list.
     */
    searchQuery: string;
}

/**
 * Identity provider list component.
 *
 * @param {IdentityProviderListPropsInterface} props Props injected to the component.
 * @return {React.ReactElement}
 */
export const IdentityProviderList: FunctionComponent<IdentityProviderListPropsInterface> = (
    props: IdentityProviderListPropsInterface
): ReactElement => {

    const {
        isLoading,
        list,
        onEmptyListPlaceholderActionClick,
        onIdentityProviderDelete,
        onSearchQueryClear,
        searchQuery
    } = props;

    const dispatch = useDispatch();

    const config: ConfigReducerStateInterface = useSelector((state: AppState) => state.config);

    const [ showDeleteConfirmationModal, setShowDeleteConfirmationModal ] = useState<boolean>(false);
    const [ deletingIDP, setDeletingIDP ] = useState<StrictIdentityProviderInterface>(undefined);

    /**
     * Redirects to the identity provider edit page when the edit button is clicked.
     *
     * @param {string} idpId Identity provider id.
     */
    const handleIdentityProviderEdit = (idpId: string): void => {
        history.push(`identity-providers/${ idpId }`);
    };

    /**
     * Deletes an identity provider when the delete identity provider button is clicked.
     *
     * @param {string} idpId Identity provider id.
     */
    const handleIdentityProviderDeleteAction = (idpId: string): void => {
        setDeletingIDP(list.identityProviders.find(idp => idp.id === idpId));
        setShowDeleteConfirmationModal(true);
    };

    /**
     * Deletes an identity provider when the delete identity provider button is clicked.
     *
     * @param {string} idpId Identity provider id.
     */
    const handleIdentityProviderDelete = (idpId: string): void => {
        deleteIdentityProvider(idpId)
            .then(() => {
                dispatch(addAlert({
                    description: "Successfully deleted the identity provider",
                    level: AlertLevels.SUCCESS,
                    message: "Delete successful"
                }));
            })
            .catch((error) => {
                if (error.response && error.response.data && error.response.data.description) {
                    dispatch(addAlert({
                        description: error.response.data.description,
                        level: AlertLevels.ERROR,
                        message: "Identity Provider Delete Error"
                    }));

                    return;
                }

                dispatch(addAlert({
                    description: "An error occurred while deleting the identity provider",
                    level: AlertLevels.ERROR,
                    message: "Identity Provider Delete Error"
                }));
            })
            .finally(() => {
                setShowDeleteConfirmationModal(false)
                setDeletingIDP(undefined)
                onIdentityProviderDelete();
            });
    };

    /**
     * Resolve the relevant placeholder.
     *
     * @return {React.ReactElement}
     */
    const showPlaceholders = (): ReactElement => {
        // When the search returns empty.
        if (searchQuery) {
            return (
                <EmptyPlaceholder
                    action={ (
                        <LinkButton onClick={ onSearchQueryClear }>Clear search query</LinkButton>
                    ) }
                    image={ EmptyPlaceholderIllustrations.emptySearch }
                    imageSize="tiny"
                    title={ "No results found" }
                    subtitle={ [
                        `We couldn't find any results for ${ searchQuery }`,
                        "Please try a different search term."
                    ] }
                />
            );
        }

        if (list?.totalResults === 0) {
            return (
                <EmptyPlaceholder
                    action={ (
                        <PrimaryButton
                            onClick={ onEmptyListPlaceholderActionClick }
                        >
                            <Icon name="add"/>
                            New Identity Provider
                        </PrimaryButton>
                    ) }
                    image={ EmptyPlaceholderIllustrations.newList }
                    imageSize="tiny"
                    title={ "Add a new Identity Provider" }
                    subtitle={ [
                        "Currently there are no identity providers available.",
                        "You can add a new identity provider easily by following the",
                        "steps in the identity providers creation wizard."
                    ] }
                />
            );
        }

        return null;
    };

    return (
        <ResourceList
            className="identity-providers-list"
            isLoading={ isLoading }
            loadingStateOptions={ {
                count: UIConstants.DEFAULT_RESOURCE_LIST_ITEM_LIMIT,
                imageType: "square"
            } }
        >
            {
                list?.identityProviders && list.identityProviders instanceof Array && list.identityProviders.length > 0
                    ? list.identityProviders.map((idp, index) => {
                        // TODO Remove this check and move the logic to backend.
                        if ("LOCAL" !== idp.name) {
                            return (
                                <ResourceList.Item
                                    key={ index }
                                    actions={ [
                                        {
                                            hidden: config.ui.doNotDeleteIdentityProviders.includes(idp.name),
                                            icon: "pencil alternate",
                                            onClick: (): void => handleIdentityProviderEdit(idp.id),
                                            popupText: "edit",
                                            type: "button"
                                        },
                                        {
                                            hidden: config.ui.doNotDeleteIdentityProviders.includes(idp.name),
                                            icon: "trash alternate",
                                            onClick: (): void => handleIdentityProviderDeleteAction(idp.id),
                                            popupText: "delete",
                                            type: "dropdown"
                                        }
                                    ] }
                                    actionsFloated="right"
                                    avatar={ (
                                        <AppAvatar
                                            name={ idp.name }
                                            image={ idp.image }
                                            size="mini"
                                            floated="left"
                                        />
                                    ) }
                                    itemHeader={ idp.name }
                                    itemDescription={ idp.description }
                                />
                            );
                        }
                    })
                    : showPlaceholders()
            }
            {
                deletingIDP && (
                    <ConfirmationModal
                        onClose={ (): void => setShowDeleteConfirmationModal(false) }
                        type="warning"
                        open={ showDeleteConfirmationModal }
                        assertion={ deletingIDP?.name }
                        assertionHint={ (
                            <p>Please type <strong>{ deletingIDP?.name }</strong> to confirm.</p>
                        ) }
                        assertionType="input"
                        primaryAction="Confirm"
                        secondaryAction="Cancel"
                        onSecondaryActionClick={ (): void => setShowDeleteConfirmationModal(false) }
                        onPrimaryActionClick={
                            (): void => handleIdentityProviderDelete(deletingIDP.id)
                        }
                    >
                        <ConfirmationModal.Header>Are you sure?</ConfirmationModal.Header>
                        <ConfirmationModal.Message attached warning>
                            This action is irreversible and will permanently delete the IDP.
                        </ConfirmationModal.Message>
                        <ConfirmationModal.Content>
                            If you delete this identity provider, you will not be able to get it back. All the
                            applications depending on this also might stop working. Please proceed with caution.
                        </ConfirmationModal.Content>
                    </ConfirmationModal>
                )
            }
        </ResourceList>
    );
};