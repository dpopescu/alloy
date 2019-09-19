/*
Copyright 2019 Adobe. All rights reserved.
This file is licensed to you under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License. You may obtain a copy
of the License at http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under
the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
OF ANY KIND, either express or implied. See the License for the specific language
governing permissions and limitations under the License.
*/

import instanceFactory from "./instanceFactory";
import { storageFactory } from "../utils";
import createLogger from "./createLogger";
import createCookieProxy from "./createCookieProxy";
import createComponentNamespacedCookieJar from "./createComponentNamespacedCookieJar";
import createLogController from "./createLogController";
import createLifecycle from "./createLifecycle";
import createComponentRegistry from "./createComponentRegistry";
import createNetwork from "./network";
import createOptIn from "./createOptIn";
import executeCommandFactory from "./executeCommandFactory";
import componentCreators from "./componentCreators";
import configureCommandFactory from "./commands/configureCommandFactory";
import logCommandFactory from "./commands/logCommandFactory";
import initializeComponentsFactory from "./initializeComponentsFactory";

// eslint-disable-next-line no-underscore-dangle
const namespaces = window.__alloyNS;

const createNamespacedStorage = storageFactory(window);

let console;

// #if _REACTOR
// When running within the Reactor extension, we want logging to be
// toggled when Reactor logging is toggled. The easiest way to do
// this is to pipe our log messages through the Reactor logger.
console = turbine.logger;
// #else
({ console } = window);
// #endif

if (namespaces) {
  namespaces.forEach(namespace => {
    const logController = createLogController(
      namespace,
      createNamespacedStorage
    );
    const logger = createLogger(console, logController, `[${namespace}]`);
    const componentRegistry = createComponentRegistry();
    const optIn = createOptIn();
    const lifecycle = createLifecycle(componentRegistry);
    let errorsEnabled = true;

    const initializeComponents = initializeComponentsFactory({
      componentCreators,
      logger,
      createCookieProxy,
      createComponentNamespacedCookieJar,
      lifecycle,
      componentRegistry,
      createNetwork,
      optIn
    });

    const logCommand = logCommandFactory({
      logController
    });

    const configureCommand = configureCommandFactory({
      componentCreators,
      logCommand,
      logger,
      initializeComponents,
      setErrorsEnabled(value) {
        errorsEnabled = value;
      },
      window
    });

    const executeCommand = executeCommandFactory({
      namespace,
      logger,
      configureCommand,
      logCommand,
      getErrorsEnabled() {
        return errorsEnabled;
      }
    });

    const instance = instanceFactory(executeCommand);

    const queue = window[namespace].q;
    queue.push = instance;
    queue.forEach(instance);
  });
}
