import { Socket } from 'socket.io';
import { UserGroupManagementService } from '../../services/UserGroupManagementService';



export class UserGroupManagementController {


  private service: UserGroupManagementService;

  constructor(){
    this.service = new UserGroupManagementService();
  }

  handleValidation = async (socket: Socket, questionId: string, data: {
    user: string,
    group: string
  }) => {

    socket.emit(`validation-${questionId}-step`, {
      step: `User ${data.user} exist?`,
      status: "loading",
    });
    const isValidUser = await this.service.validateUser(data.user);
    socket.emit(`validation-${questionId}-step`, {
      step: `User ${data.user} exist?`,
      status: isValidUser ? "success" : "failed",
    });


    socket.emit(`validation-${questionId}-step`, {
      step: `User ${data.user} exist?`,
      status: "loading",
    });
    const isValidGroup = await this.service.validateGroup(data.group);
    socket.emit(`validation-${questionId}-step`, {
      step: `User ${data.user} exist?`,
      status: isValidGroup ? "success" : "failed",
    });
  }


  handleUserValidation = async (socket: Socket, questionId: string, data: {
    user: string,
    group: string
  }) => {

    socket.emit(`validation-${questionId}-step`, {
      step: `User ${data.user} exist?`,
      status: "loading",
    });
    const isValidUser = await this.service.validateUser(data.user);
    socket.emit(`validation-${questionId}-step`, {
      step: `User ${data.user} exist?`,
      status: isValidUser ? "success" : "failed",
    });
  }

  handleGroupValidation = async (socket: Socket, questionId: string, data: {
    group: string
  }) => {
    socket.emit(`validation-${questionId}-step`, {
      step: `Group ${data.group} exist?`,
      status: "loading",
    });
    const isValidGroup = await this.service.validateGroup(data.group);
    socket.emit(`validation-${questionId}-step`, {
      step: `Group ${data.group} exist?`,
      status: isValidGroup ? "success" : "failed",
    });
  }

}
