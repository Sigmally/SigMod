          <div class="top-mod-menu" id="tmm">
            <div class="top-left-mod-menu">
              <div class="titleImg"></div>
              <h4 class="Sett SettingsTitle">Mod Settings</h4>
            </div>
            <div id="action-top-menu">
                <button type="button" class="BackBtn" id="back"></button>
                <input type="button" id="Close" class="CloseBtn"/>
            </div>
          </div>
          <hr/>
          <div class="ModMenu-inner">
           <div class="cards-center">
            <div class="card">
              <h5 class="Sett">Key Mappings</h5>
              <label class="kmp">
                <input type="text" name="keyBindingsRapidFeed" class="keybinding" id="fastFeedi" value="${rxSettings.keyBindingsRapidFeed}" maxlength="1" onfocus="this.select()">
                <span class="text">Rapid Feed</span>
              </label>
              <label class="kmp">
                <input type="text" name="keyBindingsdoubleSplit" class="keybinding" id="doubleSpliti" value="${rxSettings.keyBindingsdoubleSplit}" maxlength="1" onfocus="this.select()">
                <span class="text">Double Split</span>
              </label>
              <label class="kmp">
                <input type="text" name="keyBindingsTripleSplit" class="keybinding" id="tripleSpliti" value="${rxSettings.keyBindingsTripleSplit}" maxlength="1" onfocus="this.select()">
                <span class="text">Triple Split</span>
              </label>
              <label class="kmp">
                <input type="text" name="keyBindingsQuadSplit" class="keybinding" id="quadSpliti" value="${rxSettings.keyBindingsQuadSplit}" maxlength="1" onfocus="this.select()">
                <span class="text">Quad Split</span>
              </label>
              <label class="kmp">
                <input type="text" name="keyBindingsToggleMenu" class="keybinding" id="toggleMenui" value="${rxSettings.keyBindingsToggleMenu}" maxlength="1" onfocus="this.select()">
                <span class="text">Toggle Menu</span>
              </label>
              <label class="kmp">
                <input type="text" name="keyBindingsRespawn" class="keybinding" id="respawni" value="${rxSettings.keyBindingsRespawn}" maxlength="1" onfocus="this.select()">
                <span class="text">Simple Respawn</span>
              </label>
            </div>
            <div class="card">
              <h5 class="Sett">Quick Options</h5>
                   <div class="checkbox-wrapper-4">
                   <input class="inp-cbx" id="EnableKeybindings" type="checkbox" checked/>
                   <label class="cbx" for="EnableKeybindings"><span>
                   <svg width="12px" height="10px">
                     <use xlink:href="#check-4"></use>
                   </svg></span><span>Keybindings</span></label>
                   <svg class="inline-svg">
                     <symbol id="check-4" viewbox="0 0 12 10">
                       <polyline points="1.5 6 4.5 9 10.5 1"></polyline>
                     </symbol>
                   </svg>
                 </div>
                 <div class="checkbox-wrapper-4">
                   <input class="inp-cbx" id="darkMode" type="checkbox"/>
                   <label class="cbx" for="darkMode"><span>
                   <svg width="12px" height="10px">
                     <use xlink:href="#check-4"></use>
                   </svg></span><span>Dark Theme</span></label>
                   <svg class="inline-svg">
                     <symbol id="check-4" viewbox="0 0 12 10">
                       <polyline points="1.5 6 4.5 9 10.5 1"></polyline>
                     </symbol>
                   </svg>
                   </div>
                 <div class="checkbox-wrapper-4">
                   <input class="inp-cbx" id="longNick" type="checkbox" checked/>
                   <label class="cbx" for="longNick"><span>
                   <svg width="12px" height="10px">
                     <use xlink:href="#check-4"></use>
                   </svg></span><span>Long Nick</span></label>
                   <svg class="inline-svg">
                     <symbol id="check-4" viewbox="0 0 12 10">
                       <polyline points="1.5 6 4.5 9 10.5 1"></polyline>
                     </symbol>
                   </svg>
                 </div>
            </div>
                <div class="card">
                    <h5 class="Sett">Others</h5>
                    <div id="modButtonsDiv">
                        <button id="n_o" class="ModButton">Name Options</button>
                        <button id="e_f" class="ModButton">Extra Features</button>
                        <button id="s_m" class="ModButton">Social Media</button>
                    </div>
                </div>
            </div>
            <div class="card-bottom">
                <span id="bottomInfo"></span>
            </div>
            <div class="tabs">
                <div class="tab hidden" id="NameTab">
                    <h2 class="tabTitle">Name Options</h2>
                        <div class="flex">
                            <div class="big_card">
                                <div class="nameMaker">
                                    <h2 class="Sett">Name maker</h2>
                                    <span class="Sett">custom name maker coming soon!</span>
                                    <span class="Sett" style="margin-top: 20px">Websites for stylish names:</span>
                                    <button class="ModButton" onclick="window.open('https://www.stylishnamemaker.com/', '_blank')">Stylish Name maker</button>
                                    <button class="ModButton" onclick="window.open('https://nickfinder.com', '_blank')">Nickfinder</button>
                                </div>
                            </div>
                            <div class="big_card">
                                <span class="Sett">saved Names:</span>
                                <div class="addNames">
                                    <input placeholder="Name" class="ModTextField" id="saveNameValue"/>
                                    <button class="ModButton" style="margin-left: 5px" id="saveNameB">Add</button>
                                </div>
                                <div class="snOverlay">
                                    <div id="savedNames"></div>
                                </div>
                            </div>
                        <div>
                    </div>
                  </div>
                </div>
                <div class="tab hidden" id="SocialMediaTab">
                    <h2 class="tabTitle">Social Media</h2>
                    <div class="flex">
                        <div class="card">
                            <span class="Sett">Youtube</span>
                            <div style="margin-top: 10px; text-align: center;">
                                <button class="ModButton" onclick="window.open('https://www.youtube.com/@sigmally', '_blank')">Cursed</button>
                                <span class="Sett smallText" onclick="window.open('https://www.youtube.com/@sigmallymod', '_blank')">Cursed - Sigmally: watch some Gameplay of Sigmally.</span>
                            </div>
                            <div style="margin-top: 10px; text-align: center;">
                                <button class="ModButton">Sigmally Modz</button>
                                <span class="Sett smallText">Sigmally Modz: introductions for Mods and more</span>
                            </div>
                        </div>
                        <div class="card">
                            <span class="Sett Discord">Discord</span>
                            <button class="ModButton" onclick="window.open('https://discord.gg/gHmhpCaPfP', '_blank')">Sigmally Modz</button>
                            <button class="ModButton" onclick="window.open('https://discord.gg/ypFVtbBWrD', '_blank')">Sigmally</button>
                        </div>
                        <div class="card">
                            <span class="Sett">Github</span>
                            <button class="ModButton" onclick="window.open('https://github.com/Sigmally', '_blank')">Sigmally Mods</button>
                            <button class="ModButton" onclick="window.open('https://github.com/chris-heney/', '_blank')">Ringzer0</button>
                            <button class="ModButton" onclick="window.open('https://github.com/search?q=Sigmally', '_blank')">General Sigmally</button>
                        </div>
                    </div>
                </div>
                <div class="tab hidden" id="ExtraFeaturesTab">
                    <h2 class="tabTitle">Extra Features</h2>
                    <div class="center1">
                        <div class="card efCard">
                            <span class="Sett">Auto Respawn</span>
                            <div class="checkbox-wrapper-4">
                               <input class="inp-cbx" id="autoRespawn" type="checkbox" />
                               <label class="cbx" for="autoRespawn"><span>
                               <svg width="12px" height="10px">
                                 <use xlink:href="#check-4"></use>
                               </svg></span><span>On</span></label>
                               <svg class="inline-svg">
                                 <symbol id="check-4" viewbox="0 0 12 10">
                                   <polyline points="1.5 6 4.5 9 10.5 1"></polyline>
                                 </symbol>
                               </svg>
                             </div>
                             <div class="flex">
                                 <span class="Sett">Interval Speed:</span>
                                 <input class="ModTextField efInput" type="number" placeholder="speed" id="ARspeed" value="1000" />
                             </div>
                         </div>
                         <div class="card efCard">
                             <span class="Sett">Delete Skin</span>
                             <div class="8hFW0">
                                 <div class="flex">
                                     <input type="text" class="ModTextField efInput" placeholder="Skin Id" id="skinIdInput">
                                     <select class="ModSelect" style="margin-left: 5px;" id="skinCategoryInput">
                                         <option value="noCategory" disabled selected>Category</option>
                                         <option value="free">free</option>
                                         <option value="level">level</option>
                                         <option value="premium">premium</option>
                                     </select>
                                 </div>
                                 <input type="button" class="ModButton" id="DelSkinBtn" value="Delete">
                             </div>
                         </div>
                    </div>
                </div>
            </div>
          </div>
