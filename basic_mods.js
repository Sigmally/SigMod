let DelSkinBtn = document.getElementById("DelSkinBtn");
DelSkinBtn.addEventListener("click", () => {
    let skinIdInput = document.getElementById("skinIdInput").value;
    let skinCategoryInput = document.getElementById("skinCategoryInput").value;
    if (skinCategoryInput === "noCategory") {
        alert("Please select a category");
        return;
    } else if (skinIdInput == "") {
        alert('Please enter a valid skin id. Go to the shop, hover over the skin you want to delete a inspect the button element. There you can find the id of the skin. Example for Chet Skin: "<div id="5ff799de9d6ee153fbb39a71" onclick="changeSkin(\'/skin/free/Chet.png\', \'5ff799de9d6ee153fbb39a71\')" class="button-success">use</div>", Copy the id (5ff799de9d6ee153fbb39a71) and paste it in the skin Id field.')
        return;
    }
    unsafeWindow.delSkin(skinIdInput, skinCategoryInput);
});

let savedNames = [];
let confirmActive = document.getElementById("confirmActive");

let savedNamesOutput = document.getElementById("savedNames");
let saveNameBtn = document.getElementById("saveNameB");
let saveNameInput = document.getElementById("saveNameValue");

saveNameBtn.addEventListener("click", () => {
    if (saveNameInput.value == "") {
        console.log("empty name");
    } else {
        setTimeout(() => {
            saveNameInput.value = "";
        }, 10);

        if (rxSettings.savedNames.includes(saveNameInput.value)) {
            console.log("You already have this name saved!");
            return;
        }

        let nameDiv = document.createElement("div");
        nameDiv.classList.add("NameDiv");

        let name = document.createElement("label");
        name.classList.add("NameLabel");
        name.innerText = saveNameInput.value;

        let delName = document.createElement("button");
        delName.innerText = "X";
        delName.classList.add("delName");

        name.addEventListener("click", () => {
            navigator.clipboard.writeText(name.innerText).then(
                () => {
                    console.log("Copied to clipboard: " + name.innerText);
                }
            );
        });

        delName.addEventListener("click", () => {
            if (confirm("Are you sure you want to delete the name '" + name.innerText + "'?")) {
                console.log("deleted name: " + name.innerText);
                nameDiv.remove();

                let index = rxSettings.savedNames.indexOf(name.innerText);
                if (index > -1) {
                    rxSettings.savedNames.splice(index, 1);
                    localStorage.setItem("rxSettings", JSON.stringify(rxSettings));
                }
            }
        });

        nameDiv.appendChild(name);
        nameDiv.appendChild(delName);
        savedNamesOutput.appendChild(nameDiv);

        rxSettings.savedNames.push(saveNameInput.value);
        localStorage.setItem("rxSettings", JSON.stringify(rxSettings));
    }
});

if (rxSettings.savedNames.length > 0) {
    rxSettings.savedNames.forEach((name) => {
        let nameDiv = document.createElement("div");
        nameDiv.classList.add("NameDiv");

        let nameLabel = document.createElement("label");
        nameLabel.classList.add("NameLabel");
        nameLabel.innerText = name;

        let delName = document.createElement("button");
        delName.innerText = "X";
        delName.classList.add("delName");

        nameLabel.addEventListener("click", () => {
            navigator.clipboard.writeText(nameLabel.innerText).then(
                () => {
                    console.log("Copied to clipboard: " + nameLabel.innerText);
                }
            );
        });

        delName.addEventListener("click", () => {
            if (
                confirm(
                    "Are you sure you want to delete the name '" +
                    nameLabel.innerText +
                    "'?"
                )
            ) {
                console.log("deleted name: " + nameLabel.innerText);
                nameDiv.remove();
                rxSettings.savedNames = rxSettings.savedNames.filter((n) => n !== nameLabel.innerText);
                localStorage.setItem("rxSettings", JSON.stringify(rxSettings));
            }
        });

        nameDiv.appendChild(nameLabel);
        nameDiv.appendChild(delName);
        savedNamesOutput.appendChild(nameDiv);
    });
}

const gameTitle = document.getElementById('title');
gameTitle.innerHTML = 'Sigmally<span style="display:block; font-size: 14px;">By RingZer0 / Cursed</span>';

let longNickEnabled = rxSettings.longNick;

let longNick = document.getElementById('longNick');
longNick.checked = rxSettings.longNick;
if (longNick.checked) {
    nickName.setAttribute('maxlength', 50);
} else {
    nickName.setAttribute('maxlength', 15);
}

longNick.addEventListener('change', () => {
    rxSettings.longNick = longNick.checked;
    localStorage.setItem('rxSettings', JSON.stringify(rxSettings));
    if (longNick.checked) {
        nickName.setAttribute('maxlength', 50);
    } else {
        nickName.setAttribute('maxlength', 15);
    }
});

darkMode_cb.addEventListener('change', () => {
    if (!darkM) {
        darkM = true;
        rxSettings.darkTheme = true;
        localStorage.setItem('rxSettings', JSON.stringify(rxSettings));
        skin_text.style.color = '#fff';

        menu.style.backgroundColor = "#222";
        rightMenu.style.backgroundColor = "#222";
        leftMenu.style.backgroundColor = "#222";
        linksMenu.style.backgroundColor = "#222";
        deathScreen.style.backgroundColor = "#222";

        elements.forEach((textElements) => {
            textElements.style.color = '#fff';
        })
    } else {
        darkM = false;
        rxSettings.darkTheme = false;
        localStorage.setItem('rxSettings', JSON.stringify(rxSettings));
        skin_text.style.color = '#222';
        menu.style.backgroundColor = "#fff";
        rightMenu.style.backgroundColor = "#fff";
        leftMenu.style.backgroundColor = "#fff";
        linksMenu.style.backgroundColor = "#fff";
        deathScreen.style.backgroundColor = "#fff";

        elements.forEach((textElements) => {
            textElements.style.color = '#222';
        })
    }
});

if (rxSettings.darkTheme) {
    darkM = true;
    darkMode_cb.checked = true;
    skin_text.style.color = '#fff';

    menu.style.backgroundColor = "#222";
    rightMenu.style.backgroundColor = "#222";
    leftMenu.style.backgroundColor = "#222";
    linksMenu.style.backgroundColor = "#222";
    deathScreen.style.backgroundColor = "#222";

    elements.forEach((textElements) => {
        textElements.style.color = '#fff';
    })
} else {
    localStorage.setItem('rxSettings', JSON.stringify(rxSettings));
    skin_text.style.color = '#222';
    menu.style.backgroundColor = "#fff";
    rightMenu.style.backgroundColor = "#fff";
    leftMenu.style.backgroundColor = "#fff";
    linksMenu.style.backgroundColor = "#fff";
    deathScreen.style.backgroundColor = "#fff";

    elements.forEach((textElements) => {
        textElements.style.color = '#222';
    })
}

let macroInputs = ['fastFeedi', 'doubleSpliti', 'tripleSpliti', 'quadSpliti', 'toggleMenui', 'respawni'];
macroInputs.forEach((macroInput) => {
    let macroKey = document.getElementById(macroInput);
    macroKey.addEventListener('input', () => {
        let propertyName = macroKey.name;
        rxSettings[propertyName] = macroKey.value;
        localStorage.setItem('rxSettings', JSON.stringify(rxSettings));
    });
})

window.rxTimeouts = [];
const amount = 10;

let e_dcb = document.getElementById("EnableKeybindings");
e_dcb.addEventListener('change', () => {
    rxSettings.Keybindings = e_dcb.checked;
    localStorage.setItem('rxSettings', JSON.stringify(rxSettings));
});

if (rxSettings.Keybindings) {
    e_dcb.checked = true;
} else {
    e_dcb.checked = false;
}

window.addEventListener('keyup', e => {
    if (e.key == rxSettings.keyBindingsRapidFeed) {
        for (var i = 0; i < rxTimeouts.length; i++) {
            clearTimeout(rxTimeouts[i]);
        }
    }
});

window.addEventListener('keydown', e => {
    let en = true;
    let inputs = document.querySelectorAll("input");
    inputs.forEach((input) => {
        input.addEventListener("input", () => {
            en = false;
        });
    });
    if (!en || document.activeElement.nodeName === "INPUT") {
        return;
    }
    if (e.key === "Tab") {
        e.preventDefault();
    }
    if (rxSettings.Keybindings) {
        en = true;
        if (e.key == rxSettings.keyBindingsToggleMenu) {
            toggleSettings();
        }
        if (e.key == rxSettings.keyBindingsRespawn) {
            location.reload();
        }
        if (e.key == rxSettings.keyBindingsRapidFeed) {
            window.dispatchEvent(new KeyboardEvent('keydown', KEY_FEED));
            window.dispatchEvent(new KeyboardEvent('keyup', KEY_FEED));
            window.dispatchEvent(new KeyboardEvent('keydown', KEY_FEED));
            window.dispatchEvent(new KeyboardEvent('keyup', KEY_FEED));
            window.dispatchEvent(new KeyboardEvent('keydown', KEY_FEED));
            window.dispatchEvent(new KeyboardEvent('keyup', KEY_FEED));
            window.dispatchEvent(new KeyboardEvent('keydown', KEY_FEED));
            window.dispatchEvent(new KeyboardEvent('keyup', KEY_FEED));
            window.dispatchEvent(new KeyboardEvent('keydown', KEY_FEED));
            window.dispatchEvent(new KeyboardEvent('keyup', KEY_FEED));
            for (var i = 0; i < amount; ++i) {
                rxTimeouts.push(setTimeout(function() {
                    window.dispatchEvent(new KeyboardEvent('keydown', KEY_FEED));
                    window.dispatchEvent(new KeyboardEvent('keyup', KEY_FEED));
                    window.dispatchEvent(new KeyboardEvent('keydown', KEY_FEED));
                    window.dispatchEvent(new KeyboardEvent('keyup', KEY_FEED));
                    window.dispatchEvent(new KeyboardEvent('keydown', KEY_FEED));
                    window.dispatchEvent(new KeyboardEvent('keyup', KEY_FEED));
                }, i));
            }

            return;
        }

        if (e.key == rxSettings.keyBindingsdoubleSplit) {
            window.dispatchEvent(new KeyboardEvent('keydown', KEY_SPLIT))
            window.dispatchEvent(new KeyboardEvent('keyup', KEY_SPLIT))
            window.dispatchEvent(new KeyboardEvent('keydown', KEY_SPLIT))
            window.dispatchEvent(new KeyboardEvent('keyup', KEY_SPLIT))
            return;
        }

        if (e.key == rxSettings.keyBindingsTripleSplit) {
            window.dispatchEvent(new KeyboardEvent('keydown', KEY_SPLIT));
            window.dispatchEvent(new KeyboardEvent('keyup', KEY_SPLIT));
            window.dispatchEvent(new KeyboardEvent('keydown', KEY_SPLIT));
            window.dispatchEvent(new KeyboardEvent('keyup', KEY_SPLIT));
            window.dispatchEvent(new KeyboardEvent('keydown', KEY_SPLIT));
            window.dispatchEvent(new KeyboardEvent('keyup', KEY_SPLIT));
            return;
        }

        if (e.key == rxSettings.keyBindingsQuadSplit) {
            window.dispatchEvent(new KeyboardEvent('keydown', KEY_SPLIT));
            window.dispatchEvent(new KeyboardEvent('keyup', KEY_SPLIT));
            window.dispatchEvent(new KeyboardEvent('keydown', KEY_SPLIT));
            window.dispatchEvent(new KeyboardEvent('keyup', KEY_SPLIT));
            window.dispatchEvent(new KeyboardEvent('keydown', KEY_SPLIT));
            window.dispatchEvent(new KeyboardEvent('keyup', KEY_SPLIT));
            window.dispatchEvent(new KeyboardEvent('keydown', KEY_SPLIT));
            window.dispatchEvent(new KeyboardEvent('keyup', KEY_SPLIT));
            return;
        }
    }
});
