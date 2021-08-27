import player
import console

# функция, хакающая только что открытую консоль
def hack():
    # переменная для хранения прошлого значения
    last = None
    while console.has_more():
        v = console.read()
        # если прошлое - слово "пароль", то текущее - сам пароль
        if last == u'пароль':
            console.write(v)
            break
        # прошлое <- текущее
        last = v

# функция, читающая все значения из консоли в список и возвращающая его
def read_all():
    data = []
    while console.has_more():
        data.append(console.read())
    return data

# функция, которая принимает путь (список команд) и проводит игрока по нему
def move_path(path):
    # i - индекс в списке команд
    i = 0
    # пока не дошли до конца массива
    while i < len(path):
        # обработать команду "влево"
        if path[i] == u'влево':
            player.left()
        # обработать команду "вправо"
        if path[i] == u'вправо':
            player.right()
        # обработать команду "вперед"
        if path[i] == u'вперед':
            # прочитать дополнительно один элемент списка
            # после команды - кол-во ходов
            player.move(path[i + 1])
            i += 1
        # следующая позиция в списке
        i += 1

# подойти к первой консоли и хакнуть ее
player.move()
player.left()
player.interact()
hack()

# повторить 4 раза (для каждого из 4х энергетических кабелей)
for i in range(4):
    # найти и прочитать путь к кабелю
    console.write(u'путь энергия' + str(i + 1))
    path = read_all()
    console.close()

    # дойти до кабеля и обрезать его
    move_path(path)
    player.interact()

    # консоль всегда правее кабеля на 3 клетке,
    # дойти, открыть и взломать
    player.left()
    player.move(3)
    player.right()
    player.interact()
    hack()

    # закрыть двери в комнате с игроком
    console.write(u'поиск игрок')
    player_room = console.read()
    console.write(u'двери ' + player_room + u' закрыть')

    # подождать, пока все роботы добегут и упрутся в двери закрытой комнаты игрока
    player.wait(40)

    # закрыть двери во всех комнатах с роботами
    console.write(u'поиск робот')
    for robot in read_all():
        console.write(u'двери ' + robot + u' закрыть')

    # открыть двери в комнате игрока, чтобы продолжить путь
    console.write(u'двери ' + player_room + u' открыть')
