const getUser = async function (req) {
    const sessionToken = getSessionToken(req);
    if (!sessionToken) {
        return res.status(301).redirect('/');
    }

    const user = await db.select('*')
        .from('se_project.sessions')
        .where('token', sessionToken)
        .innerJoin('se_project.users', 'se_project.sessions.userid', 'se_project.users.id')
        .innerJoin('se_project.roles', 'se_project.users.roleid', 'se_project.roles.id')
        .first();

    console.log('user =>', user)
    user.isStudent = user.roleid === roles.student;
    user.isAdmin = user.roleid === roles.admin;
    user.isSenior = user.roleid === roles.senior;

    return user;
}