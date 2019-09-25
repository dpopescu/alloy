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

import networkToolFactory from "../../../../../src/core/tools/networkToolFactory";

describe("networkToolFactory", () => {
  it("returns network tool", () => {
    const network = { sendRequest() {} };
    const createNetwork = jasmine.createSpy().and.returnValue(network);
    const lifecycle = { onComponentsRegistered() {} };
    const logger = { log() {} };
    const config = { a: "b" };
    const networkStrategy = () => {};
    const tool = networkToolFactory(
      createNetwork,
      lifecycle,
      logger,
      networkStrategy
    )(config)();
    expect(createNetwork).toHaveBeenCalledWith(
      config,
      logger,
      lifecycle,
      networkStrategy
    );
    expect(tool).toBe(network);
  });
});
